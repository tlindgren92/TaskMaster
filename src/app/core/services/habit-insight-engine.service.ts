import { Injectable, inject, computed } from '@angular/core';
import { HabitService } from './habit.service';
import {
  Habit,
  HabitCompletion,
  HabitFrequency,
  HabitCategory,
  HABIT_CATEGORY_LABELS,
} from '../../models/habit.model';
import { isScheduledForDay } from '../utils/streak.utils';
import { startOfDay, getWeekNumber, addDays } from '../utils/date.utils';

export interface WeekdayStat {
  dayOfWeek: number;
  label: string;
  completions: number;
  scheduledSlots: number;
  rate: number;
}

export interface HabitRisk {
  habitId: string;
  title: string;
  currentStreak: number;
  reason: 'missed_today' | 'missed_yesterday' | 'rate_dropping';
}

export interface CategoryStat {
  category: HabitCategory;
  label: string;
  completions: number;
  habits: number;
  rate: number;
}

export interface InsightSnapshot {
  perfectWeeks: number;
  perfectMonths: number;
  weeklyCompletionRate: number;
  bestDay: WeekdayStat | null;
  worstDay: WeekdayStat | null;
  bestHour: number | null;
  anchorHabitId: string | null;
  anchorHabitTitle: string | null;
  habitsAtRisk: HabitRisk[];
  strongCategory: CategoryStat | null;
  weakCategory: CategoryStat | null;
}

const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

@Injectable({ providedIn: 'root' })
export class HabitInsightEngineService {
  private habitService = inject(HabitService);

  readonly weekdayDistribution = computed<WeekdayStat[]>(() => {
    const habits = this.habitService.activeHabits();
    const completions = this.habitService.completions();
    return this.computeWeekdayDistribution(habits, completions);
  });

  readonly bestDayOfWeek = computed<WeekdayStat | null>(() => {
    const stats = this.weekdayDistribution().filter(s => s.scheduledSlots > 0);
    if (stats.length === 0) return null;
    return stats.reduce((best, s) => (s.rate > best.rate ? s : best));
  });

  readonly worstDayOfWeek = computed<WeekdayStat | null>(() => {
    const stats = this.weekdayDistribution().filter(s => s.scheduledSlots > 0);
    if (stats.length === 0) return null;
    return stats.reduce((worst, s) => (s.rate < worst.rate ? s : worst));
  });

  readonly bestHourOfDay = computed<number | null>(() => {
    const completions = this.habitService.completions();
    if (completions.length === 0) return null;
    const hourly = new Array(24).fill(0);
    for (const c of completions) {
      const h = new Date(c.completedAt).getHours();
      hourly[h]++;
    }
    const max = Math.max(...hourly);
    if (max === 0) return null;
    return hourly.indexOf(max);
  });

  readonly anchorHabit = computed(() => {
    const stats = this.habitService.habitsWithStats();
    if (stats.length === 0) return null;
    const withCompletions = stats.filter(h => h.streak.totalCompletions > 0);
    if (withCompletions.length === 0) return null;
    return withCompletions.reduce((best, h) => (h.completionRate > best.completionRate ? h : best));
  });

  readonly habitsAtRisk = computed<HabitRisk[]>(() => {
    const stats = this.habitService.habitsWithStats();
    const today = new Date();
    const todayDow = today.getDay();
    const risks: HabitRisk[] = [];

    for (const h of stats) {
      if (h.streak.currentStreak === 0) continue;
      const scheduledToday = isScheduledForDay(h.frequency, todayDow, h.customDays);
      if (scheduledToday && !h.completedToday) {
        risks.push({
          habitId: h.id,
          title: h.title,
          currentStreak: h.streak.currentStreak,
          reason: 'missed_today',
        });
      }
    }
    return risks;
  });

  readonly weeklyCompletionRate = computed(() => {
    const habits = this.habitService.activeHabits();
    const completions = this.habitService.completions();
    return this.computeRangeCompletionRate(habits, completions, addDays(new Date(), -6), new Date());
  });

  readonly perfectWeeks = computed(() => {
    const habits = this.habitService.activeHabits();
    const completions = this.habitService.completions();
    return this.countPerfectWeeks(habits, completions);
  });

  readonly perfectMonths = computed(() => {
    const habits = this.habitService.activeHabits();
    const completions = this.habitService.completions();
    return this.countPerfectMonths(habits, completions);
  });

  readonly strongCategory = computed<CategoryStat | null>(() => {
    const stats = this.categoryStats();
    if (stats.length === 0) return null;
    return stats.reduce((best, s) => (s.rate > best.rate ? s : best));
  });

  readonly weakCategory = computed<CategoryStat | null>(() => {
    const stats = this.categoryStats().filter(s => s.habits > 0);
    if (stats.length === 0) return null;
    return stats.reduce((worst, s) => (s.rate < worst.rate ? s : worst));
  });

  readonly categoryStats = computed<CategoryStat[]>(() => {
    const habits = this.habitService.activeHabits();
    const completions = this.habitService.completions();
    return this.computeCategoryStats(habits, completions);
  });

  readonly snapshot = computed<InsightSnapshot>(() => ({
    perfectWeeks: this.perfectWeeks(),
    perfectMonths: this.perfectMonths(),
    weeklyCompletionRate: this.weeklyCompletionRate(),
    bestDay: this.bestDayOfWeek(),
    worstDay: this.worstDayOfWeek(),
    bestHour: this.bestHourOfDay(),
    anchorHabitId: this.anchorHabit()?.id ?? null,
    anchorHabitTitle: this.anchorHabit()?.title ?? null,
    habitsAtRisk: this.habitsAtRisk(),
    strongCategory: this.strongCategory(),
    weakCategory: this.weakCategory(),
  }));

  // ─── Public pure helpers (also exported for tests) ─────────────

  computeWeekdayDistribution(habits: Habit[], completions: HabitCompletion[]): WeekdayStat[] {
    const result: WeekdayStat[] = WEEKDAY_LABELS.map((label, dayOfWeek) => ({
      dayOfWeek,
      label,
      completions: 0,
      scheduledSlots: 0,
      rate: 0,
    }));

    const now = new Date();
    for (const h of habits) {
      const created = startOfDay(new Date(h.createdAt));
      let cursor = new Date(created);
      while (cursor.getTime() <= now.getTime()) {
        if (isScheduledForDay(h.frequency, cursor.getDay(), h.customDays)) {
          result[cursor.getDay()].scheduledSlots++;
        }
        cursor = addDays(cursor, 1);
      }
    }

    for (const c of completions) {
      const dow = new Date(c.completedAt).getDay();
      result[dow].completions++;
    }

    for (const r of result) {
      r.rate = r.scheduledSlots > 0 ? Math.round((r.completions / r.scheduledSlots) * 100) : 0;
    }
    return result;
  }

  computeCategoryStats(habits: Habit[], completions: HabitCompletion[]): CategoryStat[] {
    const byCategory = new Map<HabitCategory, { habits: Habit[]; completions: number }>();
    for (const h of habits) {
      if (!byCategory.has(h.category)) byCategory.set(h.category, { habits: [], completions: 0 });
      byCategory.get(h.category)!.habits.push(h);
    }
    for (const c of completions) {
      const habit = habits.find(h => h.id === c.habitId);
      if (!habit) continue;
      byCategory.get(habit.category)!.completions++;
    }

    const result: CategoryStat[] = [];
    for (const [category, bucket] of byCategory) {
      const scheduled = this.countScheduledSlots(bucket.habits);
      result.push({
        category,
        label: HABIT_CATEGORY_LABELS[category] ?? category,
        completions: bucket.completions,
        habits: bucket.habits.length,
        rate: scheduled > 0 ? Math.round((bucket.completions / scheduled) * 100) : 0,
      });
    }
    return result;
  }

  computeRangeCompletionRate(habits: Habit[], completions: HabitCompletion[], from: Date, to: Date): number {
    const start = startOfDay(from);
    const end = startOfDay(to);
    let scheduled = 0;
    for (const h of habits) {
      const hStart = startOfDay(new Date(h.createdAt));
      const rangeStart = hStart > start ? hStart : start;
      let cursor = new Date(rangeStart);
      while (cursor.getTime() <= end.getTime()) {
        if (isScheduledForDay(h.frequency, cursor.getDay(), h.customDays)) {
          scheduled++;
        }
        cursor = addDays(cursor, 1);
      }
    }
    if (scheduled === 0) return 0;

    const inRange = completions.filter(c => {
      const d = startOfDay(new Date(c.completedAt));
      return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    });
    return Math.min(100, Math.round((inRange.length / scheduled) * 100));
  }

  countPerfectWeeks(habits: Habit[], completions: HabitCompletion[]): number {
    if (habits.length === 0) return 0;
    const buckets = new Map<string, { scheduled: number; completed: number }>();

    for (const h of habits) {
      const start = startOfDay(new Date(h.createdAt));
      let cursor = new Date(start);
      const now = startOfDay(new Date());
      while (cursor.getTime() <= now.getTime()) {
        if (isScheduledForDay(h.frequency, cursor.getDay(), h.customDays)) {
          const key = this.weekBucketKey(cursor);
          if (!buckets.has(key)) buckets.set(key, { scheduled: 0, completed: 0 });
          buckets.get(key)!.scheduled++;
        }
        cursor = addDays(cursor, 1);
      }
    }

    for (const c of completions) {
      const d = startOfDay(new Date(c.completedAt));
      const key = this.weekBucketKey(d);
      if (buckets.has(key)) buckets.get(key)!.completed++;
    }

    let count = 0;
    for (const [key, bucket] of buckets) {
      if (this.weekBucketIsCurrent(key)) continue;
      if (bucket.scheduled > 0 && bucket.completed >= bucket.scheduled) count++;
    }
    return count;
  }

  countPerfectMonths(habits: Habit[], completions: HabitCompletion[]): number {
    if (habits.length === 0) return 0;
    const buckets = new Map<string, { scheduled: number; completed: number }>();

    for (const h of habits) {
      const start = startOfDay(new Date(h.createdAt));
      let cursor = new Date(start);
      const now = startOfDay(new Date());
      while (cursor.getTime() <= now.getTime()) {
        if (isScheduledForDay(h.frequency, cursor.getDay(), h.customDays)) {
          const key = this.monthBucketKey(cursor);
          if (!buckets.has(key)) buckets.set(key, { scheduled: 0, completed: 0 });
          buckets.get(key)!.scheduled++;
        }
        cursor = addDays(cursor, 1);
      }
    }

    for (const c of completions) {
      const d = startOfDay(new Date(c.completedAt));
      const key = this.monthBucketKey(d);
      if (buckets.has(key)) buckets.get(key)!.completed++;
    }

    const currentKey = this.monthBucketKey(new Date());
    let count = 0;
    for (const [key, bucket] of buckets) {
      if (key === currentKey) continue;
      if (bucket.scheduled > 0 && bucket.completed >= bucket.scheduled) count++;
    }
    return count;
  }

  private countScheduledSlots(habits: Habit[]): number {
    const now = new Date();
    let count = 0;
    for (const h of habits) {
      let cursor = startOfDay(new Date(h.createdAt));
      while (cursor.getTime() <= now.getTime()) {
        if (isScheduledForDay(h.frequency, cursor.getDay(), h.customDays)) count++;
        cursor = addDays(cursor, 1);
      }
    }
    return count;
  }

  private weekBucketKey(date: Date): string {
    return `${date.getFullYear()}-W${getWeekNumber(date)}`;
  }

  private weekBucketIsCurrent(key: string): boolean {
    return key === this.weekBucketKey(new Date());
  }

  private monthBucketKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
