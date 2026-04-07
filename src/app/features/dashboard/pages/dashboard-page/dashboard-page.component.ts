import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { HabitService } from '../../../../core/services/habit.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import { UserService } from '../../../../core/services/user.service';
import { XpBarComponent } from '../../../../shared/components/ui/xp-bar/xp-bar.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { TodayHabitsComponent } from '../../components/today-habits/today-habits.component';
import { StreakOverviewComponent } from '../../components/streak-overview/streak-overview.component';
import { QuickStatsComponent } from '../../components/quick-stats/quick-stats.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    XpBarComponent, ProgressBarComponent,
    TodayHabitsComponent, StreakOverviewComponent, QuickStatsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Greeting -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ getGreeting() }}, {{ userService.displayName() }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">{{ getTodayDate() }}</p>
      </div>

      <!-- XP Bar -->
      <div class="card p-4">
        <app-xp-bar />
      </div>

      <!-- Quick stats -->
      <app-quick-stats />

      <!-- Today's progress -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-900">Progreso de hoy</h2>
          <span class="text-sm font-medium text-indigo-600">{{ habitService.todayProgress() }}%</span>
        </div>
        <app-progress-bar [value]="habitService.todayProgress()" [showLabel]="false" color="indigo" />
      </div>

      <!-- Today's habits -->
      <app-today-habits (habitToggled)="onHabitToggled($event)" />

      <!-- Best streaks -->
      <app-streak-overview />
    </div>
  `,
})
export class DashboardPageComponent implements OnInit {
  habitService = inject(HabitService);
  gamificationService = inject(GamificationService);
  userService = inject(UserService);
  private router = inject(Router);

  ngOnInit(): void {
    this.habitService.loadHabits();
    this.gamificationService.loadData();
    this.userService.loadUser();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  onHabitToggled(event: { id: string; completed: boolean }): void {
    if (event.completed) {
      this.habitService.uncompleteHabit(event.id);
    } else {
      const result = this.habitService.completeHabit(event.id);
      if (result.xpEarned > 0) {
        this.gamificationService.awardXP(result.xpEarned, 'Habito completado');
        this.checkAchievements();
      }
    }
  }

  private checkAchievements(): void {
    const stats = this.habitService.habitsWithStats();
    const maxStreak = Math.max(0, ...stats.map(h => h.streak.currentStreak));

    this.gamificationService.checkAchievements({
      maxStreak,
      totalCompletions: this.habitService.completions().length,
      habitsCreated: this.habitService.activeHabits().length,
      categoriesUsed: this.habitService.categories().length,
      currentLevel: this.gamificationService.userLevel().level,
      perfectWeeks: 0,
      perfectMonths: 0,
    });
  }
}
