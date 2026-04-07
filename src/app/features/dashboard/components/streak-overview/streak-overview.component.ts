import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../../../core/services/habit.service';
import { StreakCounterComponent } from '../../../../shared/components/ui/streak-counter/streak-counter.component';

@Component({
  selector: 'app-streak-overview',
  standalone: true,
  imports: [RouterLink, StreakCounterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (topStreaks().length > 0) {
      <div class="card p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Mejores rachas</h2>
        <div class="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          @for (habit of topStreaks(); track habit.id) {
            <a [routerLink]="['/habits', habit.id]"
               class="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors min-w-[100px] cursor-pointer">
              <span class="text-2xl">{{ habit.icon }}</span>
              <app-streak-counter [streak]="habit.streak.currentStreak" [showLabel]="false" />
              <p class="text-xs text-gray-600 text-center truncate w-full">{{ habit.title }}</p>
            </a>
          }
        </div>
      </div>
    }
  `,
})
export class StreakOverviewComponent {
  private habitService = inject(HabitService);

  topStreaks = computed(() =>
    this.habitService.habitsWithStats()
      .filter(h => h.streak.currentStreak > 0)
      .sort((a, b) => b.streak.currentStreak - a.streak.currentStreak)
      .slice(0, 8)
  );
}
