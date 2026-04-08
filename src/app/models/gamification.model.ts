import { HabitCategory } from './habit.model';

export interface UserLevel {
  level: number;
  title: string;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: AchievementRequirement;
  xpReward: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

export enum AchievementCategory {
  STREAK = 'streak',
  CONSISTENCY = 'consistency',
  VARIETY = 'variety',
  MILESTONE = 'milestone',
  EXPLORER = 'explorer',
  LEVEL = 'level'
}

export interface AchievementRequirement {
  type: AchievementRequirementType;
  value: number;
}

export type AchievementRequirementType =
  | 'streak_days'
  | 'total_completions'
  | 'habits_created'
  | 'level_reached'
  | 'categories_used'
  | 'perfect_week'
  | 'perfect_month';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  startDate: Date;
  endDate: Date;
  requirement: ChallengeRequirement;
  xpReward: number;
  pointsReward: number;
  progress: number;
  isCompleted: boolean;
  isActive: boolean;
}

export type ChallengeType = 'weekly' | 'monthly' | 'special';

export interface ChallengeRequirement {
  type: 'complete_n_habits' | 'maintain_streak' | 'complete_category' | 'no_missed_days';
  value: number;
  habitCategory?: HabitCategory;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  image?: string;
  pointsCost: number;
  category: RewardCategory;
  stock?: number;
  isAvailable: boolean;
}

export enum RewardCategory {
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
  EXPERIENCE = 'experience',
  DONATION = 'donation'
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  redeemedAt: Date;
  pointsSpent: number;
  status: RedemptionStatus;
  fulfilledAt?: Date;
}

export type RedemptionStatus = 'pending' | 'fulfilled' | 'cancelled';

export const XP_CONFIG = {
  HABIT_COMPLETION: 10,
  STREAK_BONUS_MULTIPLIER: 0.5,
  STREAK_7_BONUS: 50,
  STREAK_30_BONUS: 200,
  STREAK_100_BONUS: 1000,
  CHALLENGE_COMPLETION: 100,
  ACHIEVEMENT_BASE: 50,
  LEVEL_BASE_XP: 100,
  LEVEL_GROWTH_FACTOR: 1.5,
  POINTS_PER_LEVEL_UP: 50,
} as const;

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Novato',
  2: 'Iniciado',
  3: 'Aprendiz',
  4: 'Practicante',
  5: 'Constante',
  6: 'Disciplinado',
  7: 'Experto',
  8: 'Maestro',
  9: 'Gran Maestro',
  10: 'Leyenda',
};

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  [AchievementCategory.STREAK]: 'Rachas',
  [AchievementCategory.CONSISTENCY]: 'Consistencia',
  [AchievementCategory.VARIETY]: 'Variedad',
  [AchievementCategory.MILESTONE]: 'Hitos',
  [AchievementCategory.EXPLORER]: 'Explorador',
  [AchievementCategory.LEVEL]: 'Nivel',
};

export const REWARD_CATEGORY_LABELS: Record<RewardCategory, string> = {
  [RewardCategory.DIGITAL]: 'Digital',
  [RewardCategory.PHYSICAL]: 'Fisico',
  [RewardCategory.EXPERIENCE]: 'Experiencia',
  [RewardCategory.DONATION]: 'Donacion',
};
