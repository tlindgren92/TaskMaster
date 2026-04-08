import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IHabitRepository } from '../interfaces/habit-repository.interface';
import {
  Habit,
  HabitCreateRequest,
  HabitUpdateRequest,
  HabitFilters,
  HabitCompletion,
  HabitCategory,
} from '../../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitLocalRepository implements IHabitRepository {
  private readonly HABITS_KEY = 'habits';
  private readonly COMPLETIONS_KEY = 'habit_completions';
  private readonly DELAY_MS = 100;

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getFromStorage<T>(key: string): T[] {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private deserializeHabit(raw: any): Habit {
    return {
      ...raw,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
  }

  private deserializeCompletion(raw: any): HabitCompletion {
    return {
      ...raw,
      completedAt: new Date(raw.completedAt),
    };
  }

  private applyFilters(habits: Habit[], filters?: HabitFilters): Habit[] {
    if (!filters) return habits;
    return habits.filter(habit => {
      if (filters.category && habit.category !== filters.category) return false;
      if (filters.type && habit.type !== filters.type) return false;
      if (filters.frequency && habit.frequency !== filters.frequency) return false;
      if (filters.isArchived !== undefined && habit.isArchived !== filters.isArchived) return false;
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchTitle = habit.title.toLowerCase().includes(search);
        const matchDesc = habit.description?.toLowerCase().includes(search);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }

  getAll(filters?: HabitFilters): Observable<Habit[]> {
    const habits = this.getFromStorage<any>(this.HABITS_KEY).map(h => this.deserializeHabit(h));
    return of(this.applyFilters(habits, filters)).pipe(delay(this.DELAY_MS));
  }

  getById(id: string): Observable<Habit | null> {
    const habits = this.getFromStorage<any>(this.HABITS_KEY).map(h => this.deserializeHabit(h));
    return of(habits.find(h => h.id === id) ?? null).pipe(delay(this.DELAY_MS));
  }

  create(request: HabitCreateRequest): Observable<Habit> {
    const habits = this.getFromStorage<any>(this.HABITS_KEY).map(h => this.deserializeHabit(h));
    const newHabit: Habit = {
      id: this.generateId(),
      userId: 'local-user',
      title: request.title,
      description: request.description,
      category: request.category ?? HabitCategory.CUSTOM,
      type: request.type,
      frequency: request.frequency,
      customDays: request.customDays,
      reminderTime: request.reminderTime,
      targetPerDay: request.targetPerDay,
      icon: request.icon,
      color: request.color ?? '#6366f1',
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    habits.push(newHabit);
    this.saveToStorage(this.HABITS_KEY, habits);
    return of(newHabit).pipe(delay(this.DELAY_MS));
  }

  update(id: string, request: HabitUpdateRequest): Observable<Habit> {
    const habits = this.getFromStorage<any>(this.HABITS_KEY).map(h => this.deserializeHabit(h));
    const index = habits.findIndex(h => h.id === id);
    if (index === -1) {
      return throwError(() => new Error('Habit not found'));
    }
    habits[index] = { ...habits[index], ...request, updatedAt: new Date() };
    this.saveToStorage(this.HABITS_KEY, habits);
    return of(habits[index]).pipe(delay(this.DELAY_MS));
  }

  delete(id: string): Observable<boolean> {
    const habits = this.getFromStorage<any>(this.HABITS_KEY).map(h => this.deserializeHabit(h));
    const filtered = habits.filter(h => h.id !== id);
    if (filtered.length === habits.length) {
      return throwError(() => new Error('Habit not found'));
    }
    this.saveToStorage(this.HABITS_KEY, filtered);
    // Also delete related completions
    const completions = this.getFromStorage<any>(this.COMPLETIONS_KEY)
      .filter((c: any) => c.habitId !== id);
    this.saveToStorage(this.COMPLETIONS_KEY, completions);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  getCompletions(habitId: string, from?: Date, to?: Date): Observable<HabitCompletion[]> {
    let completions = this.getFromStorage<any>(this.COMPLETIONS_KEY)
      .map(c => this.deserializeCompletion(c))
      .filter(c => c.habitId === habitId);

    if (from) {
      completions = completions.filter(c => c.completedAt >= from);
    }
    if (to) {
      completions = completions.filter(c => c.completedAt <= to);
    }

    return of(completions).pipe(delay(this.DELAY_MS));
  }

  getAllCompletions(): Observable<HabitCompletion[]> {
    const completions = this.getFromStorage<any>(this.COMPLETIONS_KEY)
      .map(c => this.deserializeCompletion(c));
    return of(completions).pipe(delay(this.DELAY_MS));
  }

  addCompletion(habitId: string, partial: Partial<HabitCompletion>): Observable<HabitCompletion> {
    const completions = this.getFromStorage<any>(this.COMPLETIONS_KEY)
      .map(c => this.deserializeCompletion(c));
    const completion: HabitCompletion = {
      id: this.generateId(),
      habitId,
      userId: 'local-user',
      completedAt: partial.completedAt ?? new Date(),
      value: partial.value,
      note: partial.note,
      xpEarned: partial.xpEarned ?? 0,
    };
    completions.push(completion);
    this.saveToStorage(this.COMPLETIONS_KEY, completions);
    return of(completion).pipe(delay(this.DELAY_MS));
  }

  removeCompletion(completionId: string): Observable<boolean> {
    const completions = this.getFromStorage<any>(this.COMPLETIONS_KEY);
    const filtered = completions.filter((c: any) => c.id !== completionId);
    if (filtered.length === completions.length) {
      return throwError(() => new Error('Completion not found'));
    }
    this.saveToStorage(this.COMPLETIONS_KEY, filtered);
    return of(true).pipe(delay(this.DELAY_MS));
  }
}
