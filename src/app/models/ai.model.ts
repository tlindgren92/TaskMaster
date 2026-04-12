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

// ─── Habit Reflection & Contextual Recommendations ──────────────

export interface HabitRecommendation {
  id: string;
  habitId: string;
  title: string;
  message: string;
  type: 'tip' | 'resource' | 'encouragement' | 'fact';
  createdAt: Date;
}

export const REFLECTION_PROMPTS: Record<string, {
  build: { placeholder: string; icon: string };
  break: { placeholder: string; icon: string };
}> = {
  learning:     { build: { placeholder: 'Que aprendiste o leiste hoy?', icon: '📖' },
                  break: { placeholder: 'Como evitaste la distraccion?', icon: '🎯' } },
  fitness:      { build: { placeholder: 'Que ejercicio hiciste?', icon: '💪' },
                  break: { placeholder: 'Como te sentiste evitando el sedentarismo?', icon: '🚶' } },
  health:       { build: { placeholder: 'Como cuidaste tu salud hoy?', icon: '🥗' },
                  break: { placeholder: 'Como fue tu dia con esta decision?', icon: '💚' } },
  mindfulness:  { build: { placeholder: 'Como te sientes despues?', icon: '🧘' },
                  break: { placeholder: 'Que te ayudo a mantener la calma?', icon: '☮️' } },
  productivity: { build: { placeholder: 'Que lograste hoy?', icon: '✅' },
                  break: { placeholder: 'Que evitaste para ser mas productivo?', icon: '🚀' } },
  social:       { build: { placeholder: 'Con quien conectaste?', icon: '👋' },
                  break: { placeholder: 'Como fue tu desconexion?', icon: '🔇' } },
  finance:      { build: { placeholder: 'Que accion financiera tomaste?', icon: '💰' },
                  break: { placeholder: 'Que gasto evitaste hoy?', icon: '🛡️' } },
  custom:       { build: { placeholder: 'Como te fue hoy?', icon: '✨' },
                  break: { placeholder: 'Como fue tu progreso hoy?', icon: '📊' } },
};

export const OFFLINE_REFLECTION_TIPS: Record<string, string[]> = {
  learning: [
    'Intenta variar entre libros y articulos para mantener la curiosidad.',
    'Compartir lo que aprendes con alguien refuerza tu memoria.',
    'Dedicar solo 15 minutos al dia ya marca una diferencia enorme a largo plazo.',
  ],
  fitness: [
    'La consistencia importa mas que la intensidad. Un paseo cuenta.',
    'Alterna entre cardio y fuerza para equilibrar tu rutina.',
    'Estirar despues del ejercicio reduce el dolor muscular significativamente.',
  ],
  health: [
    'Recuerda que cada decision saludable cuenta, por pequena que sea.',
    'Beber un vaso de agua antes de cada comida mejora la digestion.',
    'Dormir bien es tan importante como comer bien y hacer ejercicio.',
  ],
  mindfulness: [
    'Incluso 5 minutos de respiracion consciente reducen el estres notablemente.',
    'La meditacion no es dejar de pensar, sino observar sin juzgar.',
    'Practicar gratitud antes de dormir mejora la calidad del sueno.',
  ],
  productivity: [
    'La tecnica Pomodoro (25 min trabajo, 5 min descanso) aumenta el enfoque.',
    'Completa la tarea mas importante del dia primero, cuando tienes mas energia.',
    'Organizar tu espacio de trabajo reduce la fatiga mental.',
  ],
  social: [
    'Las conexiones genuinas se construyen con pequenos gestos constantes.',
    'Escuchar activamente es el regalo mas valioso que puedes dar a alguien.',
    'Un mensaje corto a alguien que aprecias puede alegrar su dia y el tuyo.',
  ],
  finance: [
    'Registrar tus gastos es el primer paso para controlar tus finanzas.',
    'La regla 50/30/20 es un buen punto de partida para tu presupuesto.',
    'Automatizar tus ahorros elimina la necesidad de fuerza de voluntad.',
  ],
  custom: [
    'Cada paso adelante, por pequeno que sea, te acerca a tu meta.',
    'Celebra tus logros, incluso los mas pequenos.',
    'La clave esta en la repeticion, no en la perfeccion.',
  ],
};

export const OFFLINE_MISSED_NUDGES: Record<string, string[]> = {
  learning: [
    'Un dia sin leer no borra todo lo aprendido. Manana es una nueva pagina por abrir.',
    'Tu cerebro sigue procesando lo que has aprendido antes, incluso cuando descansas.',
  ],
  fitness: [
    'El descanso tambien es parte del entrenamiento. Manana tu cuerpo estara listo.',
    'Una pausa no significa rendirse. Los atletas profesionales tambien descansan.',
  ],
  health: [
    'Un dia no define tu camino. Lo importante es la direccion general, no cada paso individual.',
    'Cuidar tu salud es un maraton, no un sprint. Sigue cuando estes listo.',
  ],
  mindfulness: [
    'Esta bien tener dias agitados. Reconocer que lo necesitas ya es un acto de mindfulness.',
    'La autocompasion es parte fundamental de la practica. Se amable contigo.',
  ],
  productivity: [
    'Todos tenemos dias menos productivos. Son parte natural del ritmo de trabajo.',
    'Descansar cuando lo necesitas te hace mas productivo a largo plazo.',
  ],
  social: [
    'Conectar con otros tiene su propio ritmo. No hay que forzarlo cada dia.',
    'A veces necesitamos tiempo a solas para poder dar lo mejor en nuestras relaciones.',
  ],
  finance: [
    'Un dia sin revisar tus finanzas no cambia tu progreso general. Retoma manana.',
    'La disciplina financiera se construye con el tiempo, no en un solo dia.',
  ],
  custom: [
    'Un dia no define tu progreso. Manana es una nueva oportunidad para avanzar.',
    'Lo importante no es no caer, sino levantarse. Tu compromiso sigue intacto.',
  ],
};
