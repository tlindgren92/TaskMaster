// ─── AI Provider Configuration ───────────────────────────────────

export type AIProviderType = 'anthropic' | 'gemini';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  maxTokens: number;
}

export const AI_PROVIDER_DEFAULTS: Record<AIProviderType, Omit<AIProviderConfig, 'apiKey'>> = {
  anthropic: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1024,
  },
  gemini: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    maxTokens: 1024,
  },
};

export const AI_PROVIDER_LABELS: Record<AIProviderType, string> = {
  anthropic: 'Anthropic Claude',
  gemini: 'Google Gemini',
};

export const AI_MODELS: Record<AIProviderType, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
  ],
};

// ─── AI Domain Models ────────────────────────────────────────────

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

// ─── AI Provider Response ────────────────────────────────────────

export interface AIResponse {
  content: string;
  provider: AIProviderType;
  model: string;
  tokensUsed?: number;
}

// ─── Offline Fallback Templates ──────────────────────────────────

export const OFFLINE_INSIGHTS: AIInsight[] = [
  {
    id: 'offline_1',
    type: 'positive_trend',
    title: 'Sigue asi!',
    message: 'La consistencia es la clave del exito. Cada dia que completas tus habitos estas construyendo la version de ti mismo que quieres ser.',
    createdAt: new Date(),
  },
  {
    id: 'offline_2',
    type: 'streak_risk',
    title: 'No pierdas tu racha',
    message: 'Los estudios muestran que mantener una racha activa aumenta la probabilidad de exito a largo plazo en un 80%.',
    createdAt: new Date(),
  },
  {
    id: 'offline_3',
    type: 'habit_correlation',
    title: 'Habitos que se refuerzan',
    message: 'Los habitos de ejercicio y meditacion se complementan. Las personas que hacen ejercicio son 40% mas propensas a meditar.',
    createdAt: new Date(),
  },
  {
    id: 'offline_4',
    type: 'optimal_time',
    title: 'Tu momento ideal',
    message: 'Las mananas son el mejor momento para habitos de alta disciplina. La fuerza de voluntad es mayor al despertar.',
    createdAt: new Date(),
  },
  {
    id: 'offline_5',
    type: 'positive_trend',
    title: 'Pequenos pasos, grandes cambios',
    message: 'Mejorar solo un 1% cada dia resulta en ser 37 veces mejor al final del ano. No subestimes el poder del progreso incremental.',
    createdAt: new Date(),
  },
];

export const OFFLINE_MOTIVATIONAL: string[] = [
  'La disciplina es el puente entre metas y logros.',
  'No se trata de ser perfecto, se trata de ser consistente.',
  'Cada habito completado es un voto a favor de la persona que quieres ser.',
  'La motivacion te pone en marcha. El habito te mantiene en movimiento.',
  'El secreto del cambio es enfocar toda tu energia en construir lo nuevo, no en luchar contra lo viejo.',
  'Los grandes cambios nacen de pequenas acciones repetidas.',
  'Tu futuro se construye con lo que haces hoy, no manana.',
  'La constancia supera al talento cuando el talento no es constante.',
  'Un habito no se puede simplemente desechar por la ventana; debe ser conducido escaleras abajo, paso a paso.',
  'Somos lo que hacemos repetidamente. La excelencia, entonces, no es un acto, sino un habito.',
];
