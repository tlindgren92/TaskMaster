export interface AISuggestion {
  id: string;
  type: AISuggestionType;
  title: string;
  description: string;
  relatedHabitIds?: string[];
  confidence: number;
  createdAt: Date;
  isDismissed: boolean;
}

export type AISuggestionType = 'new_habit' | 'improvement' | 'correlation' | 'motivational';

export interface AIInsight {
  id: string;
  type: AIInsightType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export type AIInsightType =
  | 'streak_risk'
  | 'positive_trend'
  | 'habit_correlation'
  | 'optimal_time'
  | 'weekly_summary';

export interface AIConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIPromptContext {
  habits: AIHabitSummary[];
  userGoals: string[];
  recentCompletions: number;
  currentLevel: number;
  dayOfWeek: string;
}

export interface AIHabitSummary {
  title: string;
  category: string;
  type: string;
  streak: number;
  completionRate: number;
}
