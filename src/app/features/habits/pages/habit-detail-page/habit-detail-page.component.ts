import { Component, inject, signal, computed, effect, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../../../../core/services/habit.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import {
  HabitWithStats,
  HabitCategory,
  HabitType,
  HabitFrequency,
  HabitUpdateRequest,
  HABIT_CATEGORY_LABELS,
  HABIT_CATEGORY_ICONS,
  HABIT_FREQUENCY_LABELS,
} from '../../../../models/habit.model';
import { StreakCounterComponent } from '../../../../shared/components/ui/streak-counter/streak-counter.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../../shared/components/ui/modal/modal.component';
import { HabitCalendarComponent } from '../../../../shared/components/ui/habit-calendar/habit-calendar.component';

@Component({
  selector: 'app-habit-detail-page',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    StreakCounterComponent, ProgressBarComponent, LoadingSpinnerComponent,
    ModalComponent, HabitCalendarComponent,
  ],
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

      @if (habit(); as h) {
        <!-- Header -->
        <div class="card p-6">
          <div class="flex items-start gap-4">
            <span class="text-4xl">{{ h.icon }}</span>
            <div class="flex-1">
              <h1 class="text-xl font-bold text-gray-900">{{ h.title }}</h1>
              @if (h.description) {
                <p class="text-sm text-gray-500 mt-1">{{ h.description }}</p>
              }
              <div class="flex items-center gap-2 mt-3 flex-wrap">
                <span class="badge badge-info">{{ getCategoryLabel(h.category) }}</span>
                <span class="badge" [class]="h.type === 'build' ? 'badge-success' : 'badge-danger'">
                  {{ h.type === 'build' ? 'Construir' : 'Dejar' }}
                </span>
                <span class="text-xs text-gray-400">{{ getFrequencyLabel(h.frequency) }}</span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <app-streak-counter [streak]="h.streak.currentStreak" />
              <div class="flex gap-1">
                <button (click)="showEditModal.set(true)"
                  class="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="toggleCompletion()"
                  class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                  [class]="h.completedToday
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'">
                  {{ h.completedToday ? 'Completado' : 'Completar' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-indigo-600">{{ h.streak.currentStreak }}</p>
            <p class="text-xs text-gray-500 mt-1">Racha actual</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-purple-600">{{ h.streak.longestStreak }}</p>
            <p class="text-xs text-gray-500 mt-1">Mejor racha</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-green-600">{{ h.streak.totalCompletions }}</p>
            <p class="text-xs text-gray-500 mt-1">Total completados</p>
          </div>
          <div class="card p-4 text-center">
            <p class="text-2xl font-bold text-amber-600">{{ h.completionRate }}%</p>
            <p class="text-xs text-gray-500 mt-1">Tasa completado</p>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="card p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Progreso general</h2>
          <app-progress-bar [value]="h.completionRate" label="Tasa de completado" />
        </div>

        <!-- Calendar heatmap -->
        <div class="card p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">Historial de actividad</h2>
          <app-habit-calendar [completions]="habitCompletions()" [numWeeks]="20" />
        </div>

        <!-- Recent completions -->
        @if (recentCompletions().length > 0) {
          <div class="card p-5">
            <h2 class="text-base font-semibold text-gray-900 mb-3">Ultimos completados</h2>
            <div class="space-y-2">
              @for (completion of recentCompletions(); track completion.id) {
                <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div class="flex items-center gap-2">
                    <span class="text-green-500">✓</span>
                    <span class="text-sm text-gray-700">{{ formatDate(completion.completedAt) }}</span>
                  </div>
                  @if (completion.xpEarned > 0) {
                    <span class="text-xs font-medium text-indigo-600">+{{ completion.xpEarned }} XP</span>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Danger zone -->
        <div class="card p-5 border-red-100">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Zona de peligro</h2>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-700">Archivar habito</p>
              <p class="text-xs text-gray-400">El habito se ocultara pero conservara su historial</p>
            </div>
            <button (click)="archiveHabit()" class="btn-danger text-xs px-3 py-1.5">Archivar</button>
          </div>
        </div>

        <!-- Edit modal -->
        <app-modal [isOpen]="showEditModal()" title="Editar habito" (closed)="showEditModal.set(false)">
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
              <input type="text" class="input-field" [(ngModel)]="editData.title" name="title" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
              <textarea class="input-field" [(ngModel)]="editData.description" name="description" rows="2"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select class="input-field" [(ngModel)]="editData.type" name="type">
                  <option value="build">Construir</option>
                  <option value="break">Dejar</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                <select class="input-field" [(ngModel)]="editData.frequency" name="frequency">
                  <option value="daily">Diario</option>
                  <option value="weekdays">Entre semana</option>
                  <option value="weekends">Fines de semana</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select class="input-field" [(ngModel)]="editData.category" name="category">
                @for (cat of categories; track cat.value) {
                  <option [value]="cat.value">{{ cat.icon }} {{ cat.label }}</option>
                }
              </select>
            </div>
          </form>
          <div modal-footer class="flex justify-end gap-3">
            <button (click)="showEditModal.set(false)" class="btn-secondary">Cancelar</button>
            <button (click)="saveEdit()" class="btn-primary">Guardar cambios</button>
          </div>
        </app-modal>
      } @else {
        <app-loading-spinner message="Cargando habito..." />
      }
    </div>
  `,
})
export class HabitDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private habitService = inject(HabitService);
  private gamificationService = inject(GamificationService);

  private habitId = signal('');
  showEditModal = signal(false);

  editData: Partial<HabitUpdateRequest> = {};

  categories = Object.values(HabitCategory).map(cat => ({
    value: cat,
    label: HABIT_CATEGORY_LABELS[cat],
    icon: HABIT_CATEGORY_ICONS[cat],
  }));

  habit = computed(() => {
    const id = this.habitId();
    if (!id) return null;
    return this.habitService.habitsWithStats().find(h => h.id === id) ?? null;
  });

  habitCompletions = computed(() => {
    const id = this.habitId();
    return this.habitService.completions().filter(c => c.habitId === id);
  });

  recentCompletions = computed(() => {
    return [...this.habitCompletions()]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.habitId.set(id);
      this.habitService.loadHabits();
      this.gamificationService.loadData();
    }
  }

  getCategoryLabel(cat: HabitCategory): string {
    return HABIT_CATEGORY_LABELS[cat] ?? cat;
  }

  getFrequencyLabel(freq: HabitFrequency): string {
    return HABIT_FREQUENCY_LABELS[freq] ?? freq;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  toggleCompletion(): void {
    const h = this.habit();
    if (!h) return;
    if (h.completedToday) {
      this.habitService.uncompleteHabit(h.id);
    } else {
      const result = this.habitService.completeHabit(h.id);
      if (result.xpEarned > 0) {
        this.gamificationService.awardXP(result.xpEarned, 'Habito completado');
        this.checkAchievements();
      }
    }
  }

  openEditModal(): void {
    const h = this.habit();
    if (!h) return;
    this.editData = {
      title: h.title,
      description: h.description,
      type: h.type,
      frequency: h.frequency,
      category: h.category,
    };
    this.showEditModal.set(true);
  }

  saveEdit(): void {
    const h = this.habit();
    if (!h) return;
    this.habitService.updateHabit(h.id, this.editData);
    this.showEditModal.set(false);
  }

  archiveHabit(): void {
    const h = this.habit();
    if (!h) return;
    if (confirm('Estas seguro de archivar este habito?')) {
      this.habitService.archiveHabit(h.id);
      this.router.navigate(['/habits']);
    }
  }

  private checkAchievements(): void {
    const stats = this.habitService.habitsWithStats();
    const maxStreak = Math.max(0, ...stats.map(h => h.streak.currentStreak));
    const totalCompletions = this.habitService.completions().length;
    const habitsCreated = this.habitService.activeHabits().length;
    const categoriesUsed = this.habitService.categories().length;

    this.gamificationService.checkAchievements({
      maxStreak,
      totalCompletions,
      habitsCreated,
      categoriesUsed,
      currentLevel: this.gamificationService.userLevel().level,
      perfectWeeks: 0,
      perfectMonths: 0,
    });
  }
}
