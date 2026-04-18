import { Injectable, inject, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import {
  Habit,
  HabitCreateRequest,
  HabitUpdateRequest,
  HabitFilters,
  HabitCompletion,
  HabitWithStats,
  HabitStreak,
  HabitFrequency,
} from '../../models/habit.model';
import { HABIT_REPOSITORY_TOKEN } from '../interfaces/habit-repository.interface';
import { calculateStreak, isScheduledForDay, isCompletedOnDate } from '../utils/streak.utils';
import { calculateHabitCompletionXP, getStreakBonusXP, isStreakMilestone } from '../utils/xp.utils';
import { XP_CONFIG } from '../../models/gamification.model';
import { isToday } from '../utils/date.utils';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private habitRepo = inject(HABIT_REPOSITORY_TOKEN);
  private notificationService = inject(NotificationService);

  private _habits = signal<Habit[]>([]);
  private _completions = signal<HabitCompletion[]>([]);
  private _filters = signal<HabitFilters>({});
  private _loading = signal(false);

  readonly habits = this._habits.asReadonly();
  readonly completions = this._completions.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly activeHabits = computed(() =>
    this._habits().filter(h => !h.isArchived)
  );

  readonly archivedHabits = computed(() =>
    this._habits().filter(h => h.isArchived)
  );

  readonly todayHabits = computed(() => {
    const today = new Date().getDay();
    return this.activeHabits().filter(h =>
      isScheduledForDay(h.frequency, today, h.customDays)
    );
  });

  readonly filteredHabits = computed(() => {
    const habits = this.activeHabits();
    const filters = this._filters();
    return this.applyFilters(habits, filters);
  });

  readonly habitsWithStats = computed<HabitWithStats[]>(() => {
    const completions = this._completions();
    return this.activeHabits().map(habit => {
      const habitCompletions = completions.filter(c => c.habitId === habit.id);
      const streak = habitCompletions.length > 0
        ? calculateStreak(habitCompletions, habit.frequency, habit.customDays)
        : { habitId: habit.id, currentStreak: 0, longestStreak: 0, lastCompletedDate: null, totalCompletions: 0 };
      const completedToday = habitCompletions.some(c => isToday(new Date(c.completedAt)));
      const totalScheduledDays = this.getTotalScheduledDays(habit);
      const completionRate = totalScheduledDays > 0
        ? Math.round((habitCompletions.length / totalScheduledDays) * 100)
        : 0;

      return { ...habit, streak, completedToday, completionRate };
    });
  });

  readonly todayHabitsWithStats = computed(() => {
    const today = new Date().getDay();
    return this.habitsWithStats().filter(h =>
      isScheduledForDay(h.frequency, today, h.customDays)
    );
  });

  readonly todayProgress = computed(() => {
    const today = this.todayHabitsWithStats();
    if (today.length === 0) return 0;
    const completed = today.filter(h => h.completedToday).length;
    return Math.round((completed / today.length) * 100);
  });

  readonly categories = computed(() => {
    const cats = this.activeHabits().map(h => h.category);
    return [...new Set(cats)];
  });

  loadHabits(): void {
    this._loading.set(true);
    this.habitRepo.getAll().subscribe({
      next: habits => {
        this._habits.set(habits);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
    this.habitRepo.getAllCompletions().subscribe({
      next: completions => this._completions.set(completions),
    });
  }

  createHabit(request: HabitCreateRequest): void {
    this._loading.set(true);
    this.habitRepo.create(request).subscribe({
      next: habit => {
        this._habits.update(list => [...list, habit]);
        this._loading.set(false);
        this.notificationService.success('Habito creado', `"${habit.title}" listo para comenzar`);
      },
      error: () => this._loading.set(false),
    });
  }

  updateHabit(id: string, request: HabitUpdateRequest): void {
    this.habitRepo.update(id, request).subscribe({
      next: updated => {
        this._habits.update(list => list.map(h => h.id === id ? updated : h));
        this.notificationService.success('Habito actualizado');
      },
    });
  }

  deleteHabit(id: string): void {
    this.habitRepo.delete(id).subscribe({
      next: () => {
        this._habits.update(list => list.filter(h => h.id !== id));
        this._completions.update(list => list.filter(c => c.habitId !== id));
        this.notificationService.info('Habito eliminado');
      },
    });
  }

  archiveHabit(id: string): void {
    this.updateHabit(id, { isArchived: true });
  }

  createHabitReturning(request: HabitCreateRequest): Observable<Habit> {
    this._loading.set(true);
    return this.habitRepo.create(request).pipe(
      tap({
        next: habit => {
          this._habits.update(list => [...list, habit]);
          this._loading.set(false);
          this.notificationService.success('Habito creado', `"${habit.title}" listo para comenzar`);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  updateHabitReturning(id: string, request: HabitUpdateRequest): Observable<Habit> {
    return this.habitRepo.update(id, request).pipe(
      tap(updated => {
        this._habits.update(list => list.map(h => h.id === id ? updated : h));
        this.notificationService.success('Habito actualizado');
      }),
    );
  }

  archiveHabitReturning(id: string): Observable<Habit> {
    return this.updateHabitReturning(id, { isArchived: true });
  }

  completeHabit(habitId: string): { xpEarned: number; streakMilestone: boolean } {
    const habit = this._habits().find(h => h.id === habitId);
    if (!habit) return { xpEarned: 0, streakMilestone: false };

    const habitCompletions = this._completions().filter(c => c.habitId === habitId);
    const currentStreak = habitCompletions.length > 0
      ? calculateStreak(habitCompletions, habit.frequency, habit.customDays).currentStreak
      : 0;

    const newStreak = currentStreak + 1;
    const xpEarned = calculateHabitCompletionXP(XP_CONFIG.HABIT_COMPLETION, newStreak);
    const bonusXP = getStreakBonusXP(newStreak);
    const totalXP = xpEarned + bonusXP;
    const streakMilestone = isStreakMilestone(newStreak);

    this.habitRepo.addCompletion(habitId, { xpEarned: totalXP }).subscribe({
      next: completion => {
        this._completions.update(list => [...list, completion]);
        if (streakMilestone) {
          this.notificationService.success(
            `Racha de ${newStreak} dias!`,
            `Has ganado ${bonusXP} XP de bonus`
          );
        }
      },
    });

    return { xpEarned: totalXP, streakMilestone };
  }

  updateCompletionNote(habitId: string, note: string): void {
    const todayCompletions = this._completions().filter(
      c => c.habitId === habitId && isToday(new Date(c.completedAt))
    );
    if (todayCompletions.length === 0) return;

    const lastCompletion = todayCompletions[todayCompletions.length - 1];
    this._completions.update(list =>
      list.map(c => c.id === lastCompletion.id ? { ...c, note } : c)
    );
  }

  uncompleteHabit(habitId: string): void {
    const todayCompletions = this._completions().filter(
      c => c.habitId === habitId && isToday(new Date(c.completedAt))
    );
    if (todayCompletions.length === 0) return;

    const lastCompletion = todayCompletions[todayCompletions.length - 1];
    this.habitRepo.removeCompletion(lastCompletion.id).subscribe({
      next: () => {
        this._completions.update(list => list.filter(c => c.id !== lastCompletion.id));
      },
    });
  }

  setFilters(filters: HabitFilters): void {
    this._filters.set(filters);
  }

  clearFilters(): void {
    this._filters.set({});
  }

  private applyFilters(habits: Habit[], filters: HabitFilters): Habit[] {
    return habits.filter(habit => {
      if (filters.category && habit.category !== filters.category) return false;
      if (filters.type && habit.type !== filters.type) return false;
      if (filters.frequency && habit.frequency !== filters.frequency) return false;
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        if (!habit.title.toLowerCase().includes(search) &&
            !habit.description?.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  private getTotalScheduledDays(habit: Habit): number {
    const created = new Date(habit.createdAt);
    const now = new Date();
    const daysDiff = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    let scheduledDays = 0;
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(created);
      date.setDate(date.getDate() + i);
      if (isScheduledForDay(habit.frequency, date.getDay(), habit.customDays)) {
        scheduledDays++;
      }
    }
    return Math.max(scheduledDays, 1);
  }
}
