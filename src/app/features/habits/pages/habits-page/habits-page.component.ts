import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HabitService } from '../../../../core/services/habit.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import {
  HabitCreateRequest,
  HabitCategory,
  HabitType,
  HabitFrequency,
  HabitWithStats,
  HABIT_CATEGORY_LABELS,
  HABIT_CATEGORY_ICONS,
  HABIT_FREQUENCY_LABELS,
} from '../../../../models/habit.model';
import { StreakCounterComponent } from '../../../../shared/components/ui/streak-counter/streak-counter.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-habits-page',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    StreakCounterComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    ModalComponent,
    LoadingSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Mis Habitos</h1>
          <p class="text-sm text-gray-500 mt-1">{{ habitService.activeHabits().length }} habitos activos</p>
        </div>
        <button (click)="showForm.set(true)" class="btn-primary flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo habito
        </button>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          (click)="activeFilter.set('all')"
          class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          [class]="activeFilter() === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          Todos
        </button>
        <button
          (click)="activeFilter.set('build')"
          class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          [class]="activeFilter() === 'build' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          Construir
        </button>
        <button
          (click)="activeFilter.set('break')"
          class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          [class]="activeFilter() === 'break' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          Dejar
        </button>
      </div>

      @if (habitService.loading()) {
        <app-loading-spinner message="Cargando habitos..." />
      }

      @if (!habitService.loading()) {
        @if (filteredHabits().length === 0) {
          <app-empty-state
            icon="🌱"
            title="Empieza tu camino"
            message="Crea tu primer habito y comienza a transformar tu vida"
            actionLabel="Crear habito"
            (actionClicked)="showForm.set(true)" />
        } @else {
          <div class="space-y-3">
            @for (habit of filteredHabits(); track habit.id) {
              <div class="card p-4 hover:shadow-md transition-shadow group">
                <div class="flex items-start gap-3">
                  <button
                    (click)="toggleHabit(habit)"
                    class="mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                    [class]="habit.completedToday
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-indigo-400'">
                    @if (habit.completedToday) {
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                    }
                  </button>
                  <a [routerLink]="['/habits', habit.id]" class="flex-1 min-w-0 cursor-pointer">
                    <div class="flex items-center gap-2">
                      <span>{{ habit.icon }}</span>
                      <h3 class="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors"
                          [class.line-through]="habit.completedToday">
                        {{ habit.title }}
                      </h3>
                    </div>
                    @if (habit.description) {
                      <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">{{ habit.description }}</p>
                    }
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      <span class="badge badge-info text-xs">{{ getCategoryLabel(habit.category) }}</span>
                      <span class="badge text-xs" [class]="habit.type === 'build' ? 'badge-success' : 'badge-danger'">
                        {{ habit.type === 'build' ? 'Construir' : 'Dejar' }}
                      </span>
                      <span class="text-xs text-gray-400">{{ getFrequencyLabel(habit.frequency) }}</span>
                    </div>
                  </a>
                  <div class="flex flex-col items-end gap-2">
                    <app-streak-counter [streak]="habit.streak.currentStreak" [showLabel]="false" />
                    <button
                      (click)="deleteHabit(habit.id)"
                      class="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="mt-3">
                  <app-progress-bar [value]="habit.completionRate" label="Tasa de completado" size="sm" />
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Create habit modal -->
      <app-modal [isOpen]="showForm()" title="Nuevo habito" (closed)="showForm.set(false)">
        <form (ngSubmit)="createHabit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
            <input type="text" class="input-field" [(ngModel)]="newHabit.title" name="title"
              placeholder="Ej: Meditar 10 minutos" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
            <textarea class="input-field" [(ngModel)]="newHabit.description" name="description"
              rows="2" placeholder="Describe tu habito..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select class="input-field" [(ngModel)]="newHabit.type" name="type">
                <option value="build">Construir</option>
                <option value="break">Dejar</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
              <select class="input-field" [(ngModel)]="newHabit.frequency" name="frequency">
                <option value="daily">Diario</option>
                <option value="weekdays">Entre semana</option>
                <option value="weekends">Fines de semana</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select class="input-field" [(ngModel)]="newHabit.category" name="category">
              @for (cat of categories; track cat.value) {
                <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
              }
            </select>
          </div>
        </form>
        <div modal-footer class="flex justify-end gap-3">
          <button (click)="showForm.set(false)" class="btn-secondary">Cancelar</button>
          <button (click)="createHabit()" class="btn-primary" [disabled]="!newHabit.title">Crear habito</button>
        </div>
      </app-modal>
    </div>
  `,
})
export class HabitsPageComponent implements OnInit {
  habitService = inject(HabitService);
  gamificationService = inject(GamificationService);

  showForm = signal(false);
  activeFilter = signal<'all' | 'build' | 'break'>('all');

  newHabit: Partial<HabitCreateRequest> = {
    title: '',
    description: '',
    type: HabitType.BUILD,
    frequency: HabitFrequency.DAILY,
    category: HabitCategory.CUSTOM,
  };

  categories = Object.values(HabitCategory).map(cat => ({
    value: cat,
    label: HABIT_CATEGORY_LABELS[cat],
    icon: HABIT_CATEGORY_ICONS[cat],
  }));

  ngOnInit(): void {
    this.habitService.loadHabits();
    this.gamificationService.loadData();
  }

  filteredHabits(): HabitWithStats[] {
    const filter = this.activeFilter();
    if (filter === 'all') return this.habitService.habitsWithStats();
    return this.habitService.habitsWithStats().filter(h => h.type === filter);
  }

  getCategoryLabel(cat: HabitCategory): string {
    return HABIT_CATEGORY_LABELS[cat] ?? cat;
  }

  getFrequencyLabel(freq: HabitFrequency): string {
    return HABIT_FREQUENCY_LABELS[freq] ?? freq;
  }

  createHabit(): void {
    if (!this.newHabit.title) return;
    this.habitService.createHabit(this.newHabit as HabitCreateRequest);
    this.showForm.set(false);
    this.resetForm();
    this.checkAchievements();
  }

  toggleHabit(habit: HabitWithStats): void {
    if (habit.completedToday) {
      this.habitService.uncompleteHabit(habit.id);
    } else {
      const result = this.habitService.completeHabit(habit.id);
      if (result.xpEarned > 0) {
        this.gamificationService.awardXP(result.xpEarned, 'Habito completado');
        this.checkAchievements();
      }
    }
  }

  deleteHabit(id: string): void {
    if (confirm('Estas seguro de eliminar este habito?')) {
      this.habitService.deleteHabit(id);
    }
  }

  private resetForm(): void {
    this.newHabit = {
      title: '',
      description: '',
      type: HabitType.BUILD,
      frequency: HabitFrequency.DAILY,
      category: HabitCategory.CUSTOM,
    };
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
