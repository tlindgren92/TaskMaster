import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { HabitService } from '../../../../core/services/habit.service';
import { GamificationService } from '../../../../core/services/gamification.service';

@Component({
  selector: 'app-quick-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-indigo-600">{{ todayTotal() }}</p>
        <p class="text-xs text-gray-500 mt-1">Habitos hoy</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ todayCompleted() }}</p>
        <p class="text-xs text-gray-500 mt-1">Completados</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-amber-600">{{ gamificationService.availablePoints() }}</p>
        <p class="text-xs text-gray-500 mt-1">Puntos</p>
      </div>
      <div class="card p-4 text-center">
        <p class="text-2xl font-bold text-purple-600">{{ bestStreak() }}</p>
        <p class="text-xs text-gray-500 mt-1">Mejor racha</p>
      </div>
    </div>
  `,
})
export class QuickStatsComponent {
  private habitService = inject(HabitService);
  gamificationService = inject(GamificationService);

  todayTotal = computed(() => this.habitService.todayHabitsWithStats().length);
  todayCompleted = computed(() =>
    this.habitService.todayHabitsWithStats().filter(h => h.completedToday).length
  );
  bestStreak = computed(() => {
    const habits = this.habitService.habitsWithStats();
    if (habits.length === 0) return 0;
    return Math.max(...habits.map(h => h.streak.currentStreak));
  });
}
