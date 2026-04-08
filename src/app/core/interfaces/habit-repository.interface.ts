import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Habit,
  HabitCreateRequest,
  HabitUpdateRequest,
  HabitFilters,
  HabitCompletion,
  HabitStreak,
} from '../../models/habit.model';

export interface IHabitRepository {
  getAll(filters?: HabitFilters): Observable<Habit[]>;
  getById(id: string): Observable<Habit | null>;
  create(habit: HabitCreateRequest): Observable<Habit>;
  update(id: string, habit: HabitUpdateRequest): Observable<Habit>;
  delete(id: string): Observable<boolean>;
  getCompletions(habitId: string, from?: Date, to?: Date): Observable<HabitCompletion[]>;
  getAllCompletions(): Observable<HabitCompletion[]>;
  addCompletion(habitId: string, completion: Partial<HabitCompletion>): Observable<HabitCompletion>;
  removeCompletion(completionId: string): Observable<boolean>;
}

export const HABIT_REPOSITORY_TOKEN = new InjectionToken<IHabitRepository>('HabitRepository');
