import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HabitInsightEngineService } from './habit-insight-engine.service';
import { HabitService } from './habit.service';
import {
  Habit,
  HabitCompletion,
  HabitCategory,
  HabitType,
  HabitFrequency,
} from '../../models/habit.model';
import { startOfDay, addDays } from '../utils/date.utils';

function makeHabit(partial: Partial<Habit> & { id: string; createdAt: Date }): Habit {
  return {
    userId: 'u1',
    title: partial.id,
    category: HabitCategory.HEALTH,
    type: HabitType.BUILD,
    frequency: HabitFrequency.DAILY,
    isArchived: false,
    updatedAt: partial.createdAt,
    ...partial,
  } as Habit;
}

function makeCompletion(habitId: string, date: Date): HabitCompletion {
  return {
    id: `c_${habitId}_${date.getTime()}`,
    habitId,
    userId: 'u1',
    completedAt: date,
    xpEarned: 10,
  };
}

describe('HabitInsightEngineService', () => {
  let engine: HabitInsightEngineService;

  beforeEach(() => {
    const habitServiceMock = {
      habits: signal<Habit[]>([]),
      completions: signal<HabitCompletion[]>([]),
      activeHabits: signal<Habit[]>([]),
      habitsWithStats: signal([]),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: HabitService, useValue: habitServiceMock },
      ],
    });
    engine = TestBed.inject(HabitInsightEngineService);
  });

  describe('computeWeekdayDistribution', () => {
    it('returns 7 buckets with zero rate when no habits', () => {
      const result = engine.computeWeekdayDistribution([], []);
      expect(result.length).toBe(7);
      expect(result.every(r => r.scheduledSlots === 0 && r.rate === 0)).toBeTrue();
    });

    it('aggregates completions per weekday', () => {
      const today = startOfDay(new Date());
      const createdAt = addDays(today, -13);
      const habit = makeHabit({ id: 'h1', createdAt });

      const completions: HabitCompletion[] = [];
      for (let i = 0; i < 14; i++) {
        const d = addDays(createdAt, i);
        if (d.getDay() === 1) completions.push(makeCompletion('h1', d));
      }

      const result = engine.computeWeekdayDistribution([habit], completions);
      const monday = result.find(r => r.dayOfWeek === 1)!;
      expect(monday.scheduledSlots).toBeGreaterThanOrEqual(1);
      expect(monday.completions).toBeGreaterThanOrEqual(1);
      expect(monday.rate).toBeGreaterThan(0);
    });
  });

  describe('countPerfectWeeks', () => {
    it('returns 0 with no habits', () => {
      expect(engine.countPerfectWeeks([], [])).toBe(0);
    });

    it('counts one perfect past week when all scheduled days completed', () => {
      const today = startOfDay(new Date());
      const twoWeeksAgoMon = addDays(today, -14 - (today.getDay() === 0 ? 6 : today.getDay() - 1));
      const habit = makeHabit({ id: 'h1', createdAt: twoWeeksAgoMon });
      const completions: HabitCompletion[] = [];
      for (let i = 0; i < 7; i++) {
        completions.push(makeCompletion('h1', addDays(twoWeeksAgoMon, i)));
      }

      const perfect = engine.countPerfectWeeks([habit], completions);
      expect(perfect).toBeGreaterThanOrEqual(1);
    });

    it('ignores current week', () => {
      const today = startOfDay(new Date());
      const habit = makeHabit({ id: 'h1', createdAt: addDays(today, -2) });
      const completions = [
        makeCompletion('h1', addDays(today, -2)),
        makeCompletion('h1', addDays(today, -1)),
        makeCompletion('h1', today),
      ];
      const result = engine.countPerfectWeeks([habit], completions);
      expect(result).toBe(0);
    });
  });

  describe('computeRangeCompletionRate', () => {
    it('returns 0 when nothing scheduled', () => {
      expect(engine.computeRangeCompletionRate([], [], new Date(), new Date())).toBe(0);
    });

    it('returns 100 when all scheduled slots completed', () => {
      const today = startOfDay(new Date());
      const from = addDays(today, -6);
      const habit = makeHabit({ id: 'h1', createdAt: from });
      const comps: HabitCompletion[] = [];
      for (let i = 0; i < 7; i++) comps.push(makeCompletion('h1', addDays(from, i)));
      const rate = engine.computeRangeCompletionRate([habit], comps, from, today);
      expect(rate).toBe(100);
    });
  });
});
