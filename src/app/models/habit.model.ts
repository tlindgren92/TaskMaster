export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: HabitCategory;
  type: HabitType;
  frequency: HabitFrequency;
  customDays?: DayOfWeek[];
  reminderTime?: string;
  targetPerDay?: number;
  icon?: string;
  color?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum HabitType {
  BUILD = 'build',
  BREAK = 'break'
}

export enum HabitFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  CUSTOM = 'custom'
}

export enum HabitCategory {
  HEALTH = 'health',
  PRODUCTIVITY = 'productivity',
  MINDFULNESS = 'mindfulness',
  FITNESS = 'fitness',
  LEARNING = 'learning',
  SOCIAL = 'social',
  FINANCE = 'finance',
  CUSTOM = 'custom'
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date;
  value?: number;
  note?: string;
  xpEarned: number;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
  totalCompletions: number;
}

export interface HabitWithStats extends Habit {
  streak: HabitStreak;
  completedToday: boolean;
  completionRate: number;
  todayProgress?: number;
}

export interface HabitCreateRequest {
  title: string;
  description?: string;
  category: HabitCategory;
  type: HabitType;
  frequency: HabitFrequency;
  customDays?: DayOfWeek[];
  reminderTime?: string;
  targetPerDay?: number;
  icon?: string;
  color?: string;
}

export interface HabitUpdateRequest {
  title?: string;
  description?: string;
  category?: HabitCategory;
  type?: HabitType;
  frequency?: HabitFrequency;
  customDays?: DayOfWeek[];
  reminderTime?: string;
  targetPerDay?: number;
  icon?: string;
  color?: string;
  isArchived?: boolean;
}

export interface HabitFilters {
  category?: HabitCategory;
  type?: HabitType;
  frequency?: HabitFrequency;
  searchTerm?: string;
  isArchived?: boolean;
}

export const HABIT_CATEGORY_LABELS: Record<HabitCategory, string> = {
  [HabitCategory.HEALTH]: 'Salud',
  [HabitCategory.PRODUCTIVITY]: 'Productividad',
  [HabitCategory.MINDFULNESS]: 'Mindfulness',
  [HabitCategory.FITNESS]: 'Ejercicio',
  [HabitCategory.LEARNING]: 'Aprendizaje',
  [HabitCategory.SOCIAL]: 'Social',
  [HabitCategory.FINANCE]: 'Finanzas',
  [HabitCategory.CUSTOM]: 'Personalizado',
};

export const HABIT_CATEGORY_ICONS: Record<HabitCategory, string> = {
  [HabitCategory.HEALTH]: '❤️',
  [HabitCategory.PRODUCTIVITY]: '⚡',
  [HabitCategory.MINDFULNESS]: '🧘',
  [HabitCategory.FITNESS]: '💪',
  [HabitCategory.LEARNING]: '📚',
  [HabitCategory.SOCIAL]: '👥',
  [HabitCategory.FINANCE]: '💰',
  [HabitCategory.CUSTOM]: '🎯',
};

export const HABIT_FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  [HabitFrequency.DAILY]: 'Diario',
  [HabitFrequency.WEEKLY]: 'Semanal',
  [HabitFrequency.WEEKDAYS]: 'Entre semana',
  [HabitFrequency.WEEKENDS]: 'Fines de semana',
  [HabitFrequency.CUSTOM]: 'Personalizado',
};

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.SUNDAY]: 'Domingo',
  [DayOfWeek.MONDAY]: 'Lunes',
  [DayOfWeek.TUESDAY]: 'Martes',
  [DayOfWeek.WEDNESDAY]: 'Miercoles',
  [DayOfWeek.THURSDAY]: 'Jueves',
  [DayOfWeek.FRIDAY]: 'Viernes',
  [DayOfWeek.SATURDAY]: 'Sabado',
};
