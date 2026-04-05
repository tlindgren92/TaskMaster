import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HabitService } from '../../../../core/services/habit.service';
import { HabitWithStats } from '../../../../models/habit.model';
import { StreakCounterComponent } from '../../../../shared/components/ui/streak-counter/streak-counter.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { HABIT_CATEGORY_LABELS, HABIT_FREQUENCY_LABELS } from '../../../../models/habit.model';

@Component({
  selector: 'app-habit-detail-page',
  standalone: true,
  imports: [RouterLink, StreakCounterComponent, ProgressBarComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Back -->
      <a routerLink="/habits" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver a habitos
      </a>

      @if (habit()) {
        <!-- Header -->
        <div class="card p-6">
          <div class="flex items-start gap-4">
            <span class="text-4xl">{{ habit()!.icon }}</span>
            <div class="flex-1">
              <h1 class="text-xl font-bold text-gray-900">{{ habit()!.title }}</h1>
              @if (habit()!.description) {
                <p class="text-sm text-gray-500 mt-1">{{ habit()!.description }}</p>
              }
              <div class="flex items-center gap-2 mt-3 flex-wrap">
                <span class="badge badge-info">{{ getCategoryLabel(habit()!.category) }}</span>
                <span class="badge" [class]="habit()!.type === 'build' ? 'badge-success' : 'badge-danger'">
                  {{ habit()!.type === 'build' ? 'Construir' : 'Dejar' }}
                </span>
                <span class="text-xs text-gray-400">{{ getFrequencyLabel(habit()!.frequency) }}</span>
              </div>
            </div>
            <app-streak-counter [streak]="habit()!.streak.currentStreak" />
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-indigo-600">{{ habit()!.streak.currentStreak }}</p>
            <p class="text-xs text-gray-500 mt-1">Racha actual</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-purple-600">{{ habit()!.streak.longestStreak }}</p>
            <p class="text-xs text-gray-500 mt-1">Mejor racha</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-green-600">{{ habit()!.streak.totalCompletions }}</p>
            <p class="text-xs text-gray-500 mt-1">Total completados</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-amber-600">{{ habit()!.completionRate }}%</p>
            <p class="text-xs text-gray-500 mt-1">Tasa completado</p>
          </div>
        </div>

        <!-- Completion rate -->
        <div class="card p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Progreso general</h2>
          <app-progress-bar [value]="habit()!.completionRate" label="Tasa de completado" />
        </div>

        <!-- Placeholder for calendar heatmap (Phase 2) -->
        <div class="card p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Historial</h2>
          <p class="text-sm text-gray-400 text-center py-8">Calendario de actividad proximamente...</p>
        </div>
      } @else {
        <app-loading-spinner message="Cargando habito..." />
      }
    </div>
  `,
})
export class HabitDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private habitService = inject(HabitService);

  habit = signal<HabitWithStats | null>(null);

  ngOnInit(): void {
    this.habitService.loadHabits();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Wait for habits to load then find
      setTimeout(() => {
        const found = this.habitService.habitsWithStats().find(h => h.id === id);
        this.habit.set(found ?? null);
      }, 200);
    }
  }

  getCategoryLabel(cat: any): string {
    return HABIT_CATEGORY_LABELS[cat as keyof typeof HABIT_CATEGORY_LABELS] ?? cat;
  }

  getFrequencyLabel(freq: any): string {
    return HABIT_FREQUENCY_LABELS[freq as keyof typeof HABIT_FREQUENCY_LABELS] ?? freq;
  }
}
