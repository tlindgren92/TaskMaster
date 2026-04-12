import { Component, inject, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../../../core/services/habit.service';
import { HabitWithStats, HabitType } from '../../../../models/habit.model';
import { StreakCounterComponent } from '../../../../shared/components/ui/streak-counter/streak-counter.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { HabitReflectionCardComponent } from '../../../../shared/components/ui/habit-reflection-card/habit-reflection-card.component';
import { MissedHabitNudgeComponent } from '../../../../shared/components/ui/missed-habit-nudge/missed-habit-nudge.component';

@Component({
  selector: 'app-today-habits',
  standalone: true,
  imports: [RouterLink, StreakCounterComponent, EmptyStateComponent, HabitReflectionCardComponent, MissedHabitNudgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
          actionLabel="Crear habito" />
      } @else {
        <div class="space-y-1">
          @for (habit of habitService.todayHabitsWithStats(); track habit.id) {
            <div>
              <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                   [class.opacity-60]="habit.completedToday">
                <!-- Check button -->
                <button
                  (click)="onToggle(habit)"
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
                <a [routerLink]="['/habits', habit.id]" class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors"
                     [class.line-through]="habit.completedToday">
                    {{ habit.icon }} {{ habit.title }}
                  </p>
                </a>
                <!-- Streak -->
                @if (habit.streak.currentStreak > 0) {
                  <app-streak-counter [streak]="habit.streak.currentStreak" [showLabel]="false" />
                }
              </div>

              <!-- Reflection card (after completing a habit) -->
              @if (lastCompletedHabitId() === habit.id) {
                <app-habit-reflection-card
                  [habit]="habit"
                  (closed)="lastCompletedHabitId.set(null)" />
              }

              <!-- Missed habit nudge (for break habits not completed today) -->
              @if (shouldShowNudge(habit)) {
                <app-missed-habit-nudge
                  [habit]="habit"
                  (dismissed)="onNudgeDismissed(habit.id)" />
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class TodayHabitsComponent {
  habitService = inject(HabitService);
  habitToggled = output<{ id: string; completed: boolean }>();

  lastCompletedHabitId = signal<string | null>(null);
  dismissedNudgeIds = signal<string[]>([]);

  private isLateInDay = computed(() => new Date().getHours() >= 18);
  private highProgress = computed(() => this.habitService.todayProgress() >= 70);

  onToggle(habit: HabitWithStats): void {
    if (habit.completedToday) {
      // Uncompleting - clear reflection if it was for this habit
      if (this.lastCompletedHabitId() === habit.id) {
        this.lastCompletedHabitId.set(null);
      }
      this.habitToggled.emit({ id: habit.id, completed: true });
    } else {
      // Completing - show reflection card
      this.lastCompletedHabitId.set(habit.id);
      this.habitToggled.emit({ id: habit.id, completed: false });
    }
  }

  onNudgeDismissed(habitId: string): void {
    this.dismissedNudgeIds.update(ids => [...ids, habitId]);
  }

  shouldShowNudge(habit: HabitWithStats): boolean {
    // Only show for break habits not completed today
    if (habit.type !== HabitType.BREAK || habit.completedToday) return false;
    // Only show late in the day or when progress is high (most habits done)
    if (!this.isLateInDay() && !this.highProgress()) return false;
    // Don't show if already dismissed this render
    if (this.dismissedNudgeIds().includes(habit.id)) return false;
    // Don't show if already shown this session
    if (MissedHabitNudgeComponent.wasShownThisSession(habit.id)) return false;
    // Don't show if reflection card is active
    if (this.lastCompletedHabitId()) return false;
    return true;
  }
}
