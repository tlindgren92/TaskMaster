import { DayOfWeek } from './habit.model';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  totalXP: number;
  currentLevel: number;
  availablePoints: number;
  timezone: string;
  language: AppLanguage;
  goals: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type AppLanguage = 'es' | 'en';

export interface UserSettings {
  notificationsEnabled: boolean;
  reminderDefaultTime: string;
  theme: AppTheme;
  weekStartsOn: DayOfWeek;
  showStreakAnimations: boolean;
  aiInsightsEnabled: boolean;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface UserCreateRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  reminderDefaultTime: '09:00',
  theme: 'system',
  weekStartsOn: DayOfWeek.MONDAY,
  showStreakAnimations: true,
  aiInsightsEnabled: true,
};
