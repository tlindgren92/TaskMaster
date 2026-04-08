import { UserLevel, XP_CONFIG, LEVEL_TITLES } from '../../models/gamification.model';

export function xpRequiredForLevel(level: number): number {
  return Math.floor(
    XP_CONFIG.LEVEL_BASE_XP * Math.pow(XP_CONFIG.LEVEL_GROWTH_FACTOR, level - 1)
  );
}

export function calculateLevel(totalXP: number): UserLevel {
  let level = 1;
  let xpRemaining = totalXP;

  while (xpRemaining >= xpRequiredForLevel(level)) {
    xpRemaining -= xpRequiredForLevel(level);
    level++;
  }

  return {
    level,
    title: LEVEL_TITLES[Math.min(level, 10)] ?? `Nivel ${level}`,
    currentXP: xpRemaining,
    xpForNextLevel: xpRequiredForLevel(level),
    totalXP,
  };
}

export function calculateHabitCompletionXP(
  baseXP: number,
  currentStreak: number
): number {
  const streakMultiplier = Math.floor(currentStreak / 7) * XP_CONFIG.STREAK_BONUS_MULTIPLIER;
  return Math.floor(baseXP * (1 + streakMultiplier));
}

export function getStreakBonusXP(streak: number): number {
  if (streak >= 100) return XP_CONFIG.STREAK_100_BONUS;
  if (streak >= 30) return XP_CONFIG.STREAK_30_BONUS;
  if (streak >= 7) return XP_CONFIG.STREAK_7_BONUS;
  return 0;
}

export function isStreakMilestone(streak: number): boolean {
  return streak === 7 || streak === 30 || streak === 100 || streak === 365;
}

export function getLevelProgress(userLevel: UserLevel): number {
  if (userLevel.xpForNextLevel === 0) return 100;
  return Math.round((userLevel.currentXP / userLevel.xpForNextLevel) * 100);
}

export function xpToNextLevel(userLevel: UserLevel): number {
  return userLevel.xpForNextLevel - userLevel.currentXP;
}
