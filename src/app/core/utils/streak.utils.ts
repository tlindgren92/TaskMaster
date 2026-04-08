import { HabitCompletion, HabitFrequency, HabitStreak, DayOfWeek } from '../../models/habit.model';
import { startOfDay, isSameDay, daysBetween, isSameWeek } from './date.utils';

export function isScheduledForDay(
  frequency: HabitFrequency,
  dayOfWeek: number,
  customDays?: DayOfWeek[]
): boolean {
  switch (frequency) {
    case HabitFrequency.DAILY:
      return true;
    case HabitFrequency.WEEKDAYS:
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case HabitFrequency.WEEKENDS:
      return dayOfWeek === 0 || dayOfWeek === 6;
    case HabitFrequency.WEEKLY:
      return true;
    case HabitFrequency.CUSTOM:
      return customDays?.includes(dayOfWeek as DayOfWeek) ?? false;
  }
}

export function calculateStreak(
  completions: HabitCompletion[],
  frequency: HabitFrequency,
  customDays?: DayOfWeek[]
): HabitStreak {
  if (completions.length === 0) {
    return {
      habitId: completions[0]?.habitId ?? '',
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      totalCompletions: 0,
    };
  }

  const sorted = [...completions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const lastCompletedDate = new Date(sorted[0].completedAt);
  const totalCompletions = sorted.length;

  if (frequency === HabitFrequency.WEEKLY) {
    return calculateWeeklyStreak(sorted, lastCompletedDate, totalCompletions);
  }

  return calculateDailyStreak(sorted, frequency, customDays, lastCompletedDate, totalCompletions);
}

function calculateDailyStreak(
  sorted: HabitCompletion[],
  frequency: HabitFrequency,
  customDays: DayOfWeek[] | undefined,
  lastCompletedDate: Date,
  totalCompletions: number,
): HabitStreak {
  const completionDates = getUniqueCompletionDates(sorted);
  const today = startOfDay(new Date());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if streak is still active (completed today or yesterday on a scheduled day)
  const lastDate = completionDates[0];
  const daysSinceLast = daysBetween(lastDate, today);

  let streakBroken = false;
  if (daysSinceLast > 1) {
    // Check if all days between last completion and today were non-scheduled
    for (let i = 1; i < daysSinceLast; i++) {
      const checkDate = new Date(lastDate);
      checkDate.setDate(checkDate.getDate() + i);
      if (isScheduledForDay(frequency, checkDate.getDay(), customDays)) {
        streakBroken = true;
        break;
      }
    }
  }

  // Calculate current streak
  if (!streakBroken) {
    currentStreak = 1;
    for (let i = 1; i < completionDates.length; i++) {
      const gap = daysBetween(completionDates[i], completionDates[i - 1]);

      if (gap === 1) {
        currentStreak++;
      } else if (gap > 1) {
        // Check if gap only contains non-scheduled days
        let allNonScheduled = true;
        for (let d = 1; d < gap; d++) {
          const checkDate = new Date(completionDates[i]);
          checkDate.setDate(checkDate.getDate() + d);
          if (isScheduledForDay(frequency, checkDate.getDay(), customDays)) {
            allNonScheduled = false;
            break;
          }
        }
        if (allNonScheduled) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  longestStreak = 1;
  for (let i = 1; i < completionDates.length; i++) {
    const gap = daysBetween(completionDates[i], completionDates[i - 1]);

    if (gap === 1) {
      tempStreak++;
    } else if (gap > 1) {
      let allNonScheduled = true;
      for (let d = 1; d < gap; d++) {
        const checkDate = new Date(completionDates[i]);
        checkDate.setDate(checkDate.getDate() + d);
        if (isScheduledForDay(frequency, checkDate.getDay(), customDays)) {
          allNonScheduled = false;
          break;
        }
      }
      if (allNonScheduled) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    habitId: sorted[0].habitId,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastCompletedDate,
    totalCompletions,
  };
}

function calculateWeeklyStreak(
  sorted: HabitCompletion[],
  lastCompletedDate: Date,
  totalCompletions: number,
): HabitStreak {
  const weeks = getUniqueCompletionWeeks(sorted);
  const today = new Date();

  let currentStreak = 0;
  const currentWeekHasCompletion = weeks.length > 0 && isSameWeek(weeks[0], today);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekHasCompletion = weeks.length > 0 && isSameWeek(weeks[0], lastWeek);

  if (currentWeekHasCompletion || lastWeekHasCompletion) {
    currentStreak = 1;
    for (let i = 1; i < weeks.length; i++) {
      const weekDiff = Math.round(
        (weeks[i - 1].getTime() - weeks[i].getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      if (weekDiff <= 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < weeks.length; i++) {
    const weekDiff = Math.round(
      (weeks[i - 1].getTime() - weeks[i].getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    if (weekDiff <= 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    habitId: sorted[0].habitId,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastCompletedDate,
    totalCompletions,
  };
}

function getUniqueCompletionDates(sorted: HabitCompletion[]): Date[] {
  const dates: Date[] = [];
  for (const completion of sorted) {
    const date = startOfDay(new Date(completion.completedAt));
    if (dates.length === 0 || !isSameDay(dates[dates.length - 1], date)) {
      dates.push(date);
    }
  }
  return dates;
}

function getUniqueCompletionWeeks(sorted: HabitCompletion[]): Date[] {
  const weeks: Date[] = [];
  for (const completion of sorted) {
    const date = startOfDay(new Date(completion.completedAt));
    if (weeks.length === 0 || !isSameWeek(weeks[weeks.length - 1], date)) {
      weeks.push(date);
    }
  }
  return weeks;
}

export function isCompletedOnDate(completions: HabitCompletion[], date: Date): boolean {
  return completions.some(c => isSameDay(new Date(c.completedAt), date));
}
