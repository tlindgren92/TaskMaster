import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HabitService } from '../../../../core/services/habit.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import { UserService } from '../../../../core/services/user.service';
import { XpBarComponent } from '../../../../shared/components/ui/xp-bar/xp-bar.component';
import { StreakCounterComponent } from '../../../../shared/components/ui/streak-counter/streak-counter.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [XpBarComponent, StreakCounterComponent, ProgressBarComponent, EmptyStateComponent, RouterLink],
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
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-indigo-600">{{ habitService.todayHabitsWithStats().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Habitos hoy</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ completedToday() }}</p>
          <p class="text-xs text-gray-500 mt-1">Completados</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-amber-600">{{ gamificationService.availablePoints() }}</p>
          <p class="text-xs text-gray-500 mt-1">Puntos</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-purple-600">{{ gamificationService.unlockedAchievements().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Logros</p>
        </div>
      </div>

      <!-- Today's progress -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-900">Progreso de hoy</h2>
          <span class="text-sm font-medium text-indigo-600">{{ habitService.todayProgress() }}%</span>
        </div>
        <app-progress-bar [value]="habitService.todayProgress()" [showLabel]="false" color="indigo" />
      </div>

      <!-- Today's habits -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">Habitos de hoy</h2>
          <a routerLink="/habits" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Ver todos</a>
        </div>

        @if (habitService.todayHabitsWithStats().length === 0) {
          <app-empty-state
            icon="🌟"
            title="Sin habitos para hoy"
            message="Crea tu primer habito para comenzar tu camino"
            actionLabel="Crear habito"
            (actionClicked)="navigateToHabits()" />
        } @else {
          <div class="space-y-2">
            @for (habit of habitService.todayHabitsWithStats(); track habit.id) {
              <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                   [class.opacity-60]="habit.completedToday">
                <!-- Check button -->
                <button
                  (click)="toggleHabit(habit.id, habit.completedToday)"
                  class="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                  [class]="habit.completedToday
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-indigo-400'">
                  @if (habit.completedToday) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                  }
                </button>
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate"
                     [class.line-through]="habit.completedToday">
                    {{ habit.icon }} {{ habit.title }}
                  </p>
                </div>
                <!-- Streak -->
                @if (habit.streak.currentStreak > 0) {
                  <app-streak-counter [streak]="habit.streak.currentStreak" [showLabel]="false" />
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Best streaks -->
      @if (topStreaks().length > 0) {
        <div class="card p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Mejores rachas</h2>
          <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            @for (habit of topStreaks(); track habit.id) {
              <div class="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 min-w-[100px]">
                <span class="text-2xl">{{ habit.icon }}</span>
                <app-streak-counter [streak]="habit.streak.currentStreak" [showLabel]="false" />
                <p class="text-xs text-gray-600 text-center truncate w-full">{{ habit.title }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardPageComponent implements OnInit {
  habitService = inject(HabitService);
  gamificationService = inject(GamificationService);
  userService = inject(UserService);

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

  completedToday(): number {
    return this.habitService.todayHabitsWithStats().filter(h => h.completedToday).length;
  }

  topStreaks() {
    return this.habitService.habitsWithStats()
      .filter(h => h.streak.currentStreak > 0)
      .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak)
      .slice(0, 5);
  }

  toggleHabit(id: string, completedToday: boolean): void {
    if (completedToday) {
      this.habitService.uncompleteHabit(id);
    } else {
      const result = this.habitService.completeHabit(id);
      if (result.xpEarned > 0) {
        this.gamificationService.awardXP(result.xpEarned, 'Habito completado');
      }
    }
  }

  navigateToHabits(): void {
    // Router navigation handled by routerLink
  }
}
