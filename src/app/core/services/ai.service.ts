import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import {
  AISuggestion,
  AIInsight,
  AIConversationMessage,
  AIPromptContext,
  AIProviderType,
  AIResponse,
  HabitRecommendation,
  OFFLINE_INSIGHTS,
  OFFLINE_MOTIVATIONAL,
  OFFLINE_REFLECTION_TIPS,
  OFFLINE_MISSED_NUDGES,
} from '../../models/ai.model';
import { HabitWithStats } from '../../models/habit.model';
import { IAIProvider, AIValidationResult } from '../interfaces/ai-provider.interface';
import { AnthropicProvider } from '../providers/ai/anthropic.provider';
import { GeminiProvider } from '../providers/ai/gemini.provider';
import { AIConfigService } from './ai-config.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class AIService {
  private anthropicProvider = inject(AnthropicProvider);
  private geminiProvider = inject(GeminiProvider);
  private configService = inject(AIConfigService);
  private notificationService = inject(NotificationService);

  // State
  private _suggestions = signal<AISuggestion[]>([]);
  private _dailyInsight = signal<AIInsight | null>(null);
  private _chatMessages = signal<AIConversationMessage[]>([]);
  private _loading = signal(false);
  private _chatLoading = signal(false);
  private _activeRecommendation = signal<HabitRecommendation | null>(null);
  private _recommendationLoading = signal(false);

  readonly suggestions = this._suggestions.asReadonly();
  readonly dailyInsight = this._dailyInsight.asReadonly();
  readonly chatMessages = this._chatMessages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly chatLoading = this._chatLoading.asReadonly();
  readonly activeRecommendation = this._activeRecommendation.asReadonly();
  readonly recommendationLoading = this._recommendationLoading.asReadonly();
  readonly isConfigured = this.configService.isConfigured;

  private getProvider(provider?: AIProviderType): IAIProvider {
    const type = provider ?? this.configService.activeProvider();
    switch (type) {
      case 'anthropic': return this.anthropicProvider;
      case 'gemini': return this.geminiProvider;
      default: return this.geminiProvider;
    }
  }

  // ─── Daily Insight ───────────────────────────────────────────

  generateDailyInsight(context: AIPromptContext): void {
    const previousMessage = this._dailyInsight()?.message;
    const config = this.configService.activeProviderConfig();
    if (!config) {
      this._dailyInsight.set(this.getOfflineInsight(previousMessage, context));
      return;
    }

    this._loading.set(true);

    const systemPrompt = this.buildSystemPrompt();
    const userMessage = this.buildInsightPrompt(context, previousMessage);

    this.getProvider().sendMessage(systemPrompt, userMessage, config).pipe(
      tap(response => {
        const insight = this.parseInsightResponse(response, context, previousMessage);
        this._dailyInsight.set(insight);
        this._loading.set(false);
      }),
      catchError(() => {
        this._dailyInsight.set(this.getOfflineInsight(previousMessage, context));
        this._loading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  // ─── Habit Suggestions ───────────────────────────────────────

  generateSuggestions(context: AIPromptContext): void {
    const config = this.configService.activeProviderConfig();
    if (!config) {
      this.notificationService.info('Configura tu API key para recibir sugerencias IA');
      return;
    }

    this._loading.set(true);

    const systemPrompt = this.buildSystemPrompt();
    const userMessage = this.buildSuggestionsPrompt(context);

    this.getProvider().sendMessage(systemPrompt, userMessage, config).pipe(
      tap(response => {
        const suggestions = this.parseSuggestionsResponse(response);
        this._suggestions.set(suggestions);
        this._loading.set(false);
      }),
      catchError(() => {
        this.notificationService.error('No se pudieron generar sugerencias');
        this._loading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  // ─── Coach Chat ──────────────────────────────────────────────

  sendChatMessage(message: string, context: AIPromptContext): void {
    const config = this.configService.activeProviderConfig();
    if (!config) {
      this.notificationService.info('Configura tu API key para usar el coach IA');
      return;
    }

    const userMsg: AIConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    this._chatMessages.update(msgs => [...msgs, userMsg]);
    this._chatLoading.set(true);

    const systemPrompt = this.buildCoachSystemPrompt(context);
    const messages = this._chatMessages();

    this.getProvider().sendConversation(systemPrompt, messages, config).pipe(
      tap(response => {
        const cleanContent = this.sanitizeAIResponse(response.content);
        const assistantMsg: AIConversationMessage = {
          role: 'assistant',
          content: cleanContent || response.content,
          timestamp: new Date(),
        };
        this._chatMessages.update(msgs => [...msgs, assistantMsg]);
        this._chatLoading.set(false);
      }),
      catchError(() => {
        const fallbackMsg: AIConversationMessage = {
          role: 'assistant',
          content: this.getMotivationalMessage(),
          timestamp: new Date(),
        };
        this._chatMessages.update(msgs => [...msgs, fallbackMsg]);
        this._chatLoading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  clearChat(): void {
    this._chatMessages.set([]);
  }

  dismissSuggestion(id: string): void {
    this._suggestions.update(list =>
      list.map(s => s.id === id ? { ...s, isDismissed: true } : s)
    );
  }

  // ─── Habit Recommendations ───────────────────────────────────

  generateHabitRecommendation(habit: HabitWithStats, reflection?: string): void {
    const config = this.configService.activeProviderConfig();
    if (!config) {
      this._activeRecommendation.set(this.getOfflineReflectionTip(habit));
      return;
    }

    this._recommendationLoading.set(true);

    const systemPrompt = this.buildRecommendationSystemPrompt();
    const userMessage = this.buildRecommendationPrompt(habit, reflection);

    this.getProvider().sendMessage(systemPrompt, userMessage, config).pipe(
      tap(response => {
        const cleaned = this.sanitizeAIResponse(response.content);
        this._activeRecommendation.set({
          id: 'rec_' + Date.now(),
          habitId: habit.id,
          title: reflection ? 'Recomendacion para ti' : 'Consejo del dia',
          message: cleaned || response.content,
          type: reflection ? 'resource' : 'tip',
          createdAt: new Date(),
        });
        this._recommendationLoading.set(false);
      }),
      catchError(() => {
        this._activeRecommendation.set(this.getOfflineReflectionTip(habit));
        this._recommendationLoading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  generateMissedHabitNudge(habit: HabitWithStats): void {
    const config = this.configService.activeProviderConfig();
    if (!config) {
      this._activeRecommendation.set(this.getOfflineMissedNudge(habit));
      return;
    }

    this._recommendationLoading.set(true);

    const systemPrompt = this.buildRecommendationSystemPrompt();
    const userMessage = this.buildMissedHabitPrompt(habit);

    this.getProvider().sendMessage(systemPrompt, userMessage, config).pipe(
      tap(response => {
        const cleaned = this.sanitizeAIResponse(response.content);
        this._activeRecommendation.set({
          id: 'nudge_' + Date.now(),
          habitId: habit.id,
          title: 'Un recordatorio amigable',
          message: cleaned || response.content,
          type: 'encouragement',
          createdAt: new Date(),
        });
        this._recommendationLoading.set(false);
      }),
      catchError(() => {
        this._activeRecommendation.set(this.getOfflineMissedNudge(habit));
        this._recommendationLoading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  dismissRecommendation(): void {
    this._activeRecommendation.set(null);
  }

  // ─── Motivational (offline) ──────────────────────────────────

  getMotivationalMessage(): string {
    return OFFLINE_MOTIVATIONAL[Math.floor(Math.random() * OFFLINE_MOTIVATIONAL.length)];
  }

  // ─── Validate API Key ────────────────────────────────────────

  validateApiKey(provider: AIProviderType, apiKey: string, model: string): Observable<AIValidationResult> {
    return this.getProvider(provider).validateApiKey(apiKey, model);
  }

  // ─── Private: Prompt builders ────────────────────────────────

  private formatHabitType(type: string): string {
    return type === 'break' ? 'DEJAR/REDUCIR' : 'DESARROLLAR';
  }

  private formatHabitForPrompt(h: { title: string; category: string; type: string; streak: number; completionRate: number }): string {
    return `${h.title} [${this.formatHabitType(h.type)}] (${h.category}, racha ${h.streak} dias, ${h.completionRate}% completado)`;
  }

  private buildSystemPrompt(): string {
    return `Eres un coach de habitos inteligente y motivador integrado en la app "TaskMaster".
Tu rol es ayudar al usuario a mejorar sus habitos, adoptar nuevos habitos positivos y dejar malos habitos.

Reglas:
- Responde SIEMPRE en espanol
- Se conciso, maximo 2-3 parrafos
- Usa un tono amigable, motivador pero no condescendiente
- Basa tus consejos en evidencia cientifica cuando sea posible
- Personaliza las respuestas segun el contexto del usuario (sus habitos, rachas, nivel)
- Nunca inventes datos del usuario, usa solo lo que se te proporciona
- Los habitos marcados como [DEJAR/REDUCIR] son habitos que el usuario quiere ELIMINAR o REDUCIR (ej: dejar de fumar, dejar de procrastinar). Completar estos habitos significa que el usuario RESISTIO la tentacion ese dia. Celebra que NO lo hizo.
- Los habitos marcados como [DESARROLLAR] son habitos que el usuario quiere CREAR o MANTENER (ej: leer, meditar, hacer ejercicio). Completar estos habitos significa que el usuario lo HIZO ese dia.`;
  }

  private buildCoachSystemPrompt(context: AIPromptContext): string {
    return `${this.buildSystemPrompt()}

IMPORTANTE: Responde siempre en texto natural conversacional. NUNCA respondas con JSON, bloques de codigo, ni backticks. Tu respuesta debe ser texto plano legible.

Contexto actual del usuario:
- Nivel: ${context.currentLevel}
- Dia: ${context.dayOfWeek}
- Completados recientes: ${context.recentCompletions}
- Objetivos: ${context.userGoals.join(', ') || 'No definidos'}
- Habitos activos:
${context.habits.map(h => `  * ${this.formatHabitForPrompt(h)}`).join('\n')}`;
  }

  private buildInsightPrompt(context: AIPromptContext, previousMessage?: string): string {
    const previousSnippet = previousMessage
      ? previousMessage.replace(/\s+/g, ' ').replace(/"/g, "'").slice(0, 180)
      : '';

    return `Genera un insight diario personalizado para el usuario.

Contexto:
- Dia: ${context.dayOfWeek}
- Nivel: ${context.currentLevel}
- Completados recientes: ${context.recentCompletions}
- Objetivos: ${context.userGoals.join(', ') || 'No definidos'}
- Habitos: ${context.habits.map(h => this.formatHabitForPrompt(h)).join('; ')}
${previousSnippet ? `- Mensaje anterior (NO repetir literal): ${previousSnippet}` : '- Primera generacion del dia'}
- Generacion: ${Date.now()}

Reglas extra:
- Debe estar basado en los habitos del contexto
- Incluye al menos un detalle concreto (categoria, racha o tasa de completado)
- Si hay mensaje anterior, cambia el angulo y evita frases identicas

IMPORTANTE: Responde UNICAMENTE con el JSON puro, sin bloques de codigo markdown, sin backticks, sin texto adicional:
{"title": "titulo corto del insight", "message": "mensaje de 1-2 oraciones maximo", "type": "positive_trend|streak_risk|habit_correlation|optimal_time|weekly_summary"}`;
  }

  private buildSuggestionsPrompt(context: AIPromptContext): string {
    return `Sugiere 2-3 habitos que complementen los habitos actuales del usuario.

Contexto:
- Objetivos: ${context.userGoals.join(', ') || 'Mejorar en general'}
- Habitos actuales: ${context.habits.map(h => `${h.title} [${this.formatHabitType(h.type)}] (${h.category})`).join(', ') || 'Ninguno'}
- Nivel: ${context.currentLevel}

IMPORTANTE: Responde UNICAMENTE con el JSON puro, sin bloques de codigo markdown, sin backticks, sin texto adicional:
[{"title": "titulo del habito sugerido", "description": "por que este habito le beneficiaria (1 oracion)", "type": "new_habit|improvement"}]`;
  }

  // ─── Private: Response parsers ───────────────────────────────

  /**
   * Limpia respuestas de IA: extrae contenido de bloques markdown,
   * remueve backticks sueltos y texto residual.
   */
  private sanitizeAIResponse(content: string): string {
    if (!content?.trim()) return '';

    let cleaned = content;

    // Extraer contenido de code blocks (capturar lo de DENTRO del bloque)
    const codeBlockMatch = cleaned.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1];
    }

    // Remover backticks sueltos
    cleaned = cleaned.replace(/`/g, '');

    return cleaned.trim();
  }

  /**
   * Extrae texto plano legible de contenido mezclado.
   * Si el contenido parece JSON, devuelve '' para forzar fallback.
   */
  private extractPlainText(content: string): string {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return '';
    }
    return trimmed
      .replace(/\{[\s\S]*?\}/g, '')
      .replace(/\[[\s\S]*?\]/g, '')
      .trim()
      .slice(0, 200);
  }

  private parseInsightResponse(response: AIResponse, context: AIPromptContext, previousMessage?: string): AIInsight {
    const cleaned = this.sanitizeAIResponse(response.content);

    try {
      const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.title === 'string' && typeof parsed.message === 'string') {
          const candidate: AIInsight = {
            id: 'ai_' + Date.now(),
            type: parsed.type || 'positive_trend',
            title: parsed.title,
            message: parsed.message,
            createdAt: new Date(),
          };

          if (this.isSameInsightMessage(candidate.message, previousMessage)) {
            return this.buildContextualFallbackInsight(context, previousMessage);
          }

          return candidate;
        }
      }
    } catch (e) {
      console.warn('[AI] Parse insight failed:', e);
    }

    const plainText = this.extractPlainText(cleaned);
    if (plainText && !this.isSameInsightMessage(plainText, previousMessage)) {
      return {
        id: 'ai_' + Date.now(),
        type: 'positive_trend',
        title: 'Insight del dia',
        message: plainText,
        createdAt: new Date(),
      };
    }

    return this.buildContextualFallbackInsight(context, previousMessage);
  }

  private parseSuggestionsResponse(response: AIResponse): AISuggestion[] {
    const cleaned = this.sanitizeAIResponse(response.content);

    try {
      const jsonMatch = cleaned.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { title: string; description: string; type: string }[];
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].title === 'string') {
          return parsed.map((s, i) => ({
            id: `suggestion_${Date.now()}_${i}`,
            type: (s.type as AISuggestion['type']) || 'new_habit',
            title: s.title,
            description: s.description || '',
            confidence: 0.8,
            createdAt: new Date(),
            isDismissed: false,
          }));
        }
      }
    } catch (e) {
      console.warn('[AI] Parse suggestions failed:', e);
    }

    return [{
      id: `suggestion_${Date.now()}`,
      type: 'new_habit',
      title: 'Sugerencia del dia',
      description: 'Intenta anadir un habito de 5 minutos a tu rutina manana.',
      confidence: 0.5,
      createdAt: new Date(),
      isDismissed: false,
    }];
  }

  private buildRecommendationSystemPrompt(): string {
    return `Eres un coach de habitos integrado en la app "TaskMaster".

Reglas:
- Responde SIEMPRE en espanol
- Responde en texto natural conversacional, maximo 2-3 oraciones
- NUNCA uses JSON, bloques de codigo, backticks ni markdown
- Se especifico y util, no generico
- Basa tus consejos en informacion real y verificable
- Usa un tono amigable y respetuoso`;
  }

  private buildRecommendationPrompt(habit: HabitWithStats, reflection?: string): string {
    const typeLabel = habit.type === 'build' ? 'construir' : 'dejar/reducir';
    return `El usuario acaba de completar su habito "${habit.title}" (categoria: ${habit.category}, tipo: ${typeLabel}).
Racha actual: ${habit.streak.currentStreak} dias. Tasa de completado: ${habit.completionRate}%.
${reflection ? `El usuario compartio: "${reflection}"` : 'El usuario no compartio detalles adicionales.'}

Genera UNA recomendacion breve y personalizada:
${reflection
  ? '- Relaciona tu recomendacion directamente con lo que el usuario compartio\n- Si menciono un libro, recomienda algo similar. Si menciono ejercicio, sugiere variaciones o tips'
  : '- Da un consejo practico y especifico para su categoria de habito'}
- Se especifico y util, no generico
- Maximo 2-3 oraciones

IMPORTANTE: Solo texto natural, sin JSON, sin markdown, sin backticks.`;
  }

  private buildMissedHabitPrompt(habit: HabitWithStats): string {
    return `El usuario tiene el habito "${habit.title}" (tipo: dejar/reducir, categoria: ${habit.category}).
Hoy NO marco este habito como completado. Racha previa: ${habit.streak.currentStreak} dias.

Genera un mensaje breve, empatico y objetivo:
- NO asustar ni culpar al usuario
- Comparte un dato informativo y positivo sobre los beneficios de mantener esta decision
- Invita gentilmente a retomar manana
- Tono: como un amigo que apoya, no como un doctor que regana
- Se delicado, especialmente con temas de salud o adicciones
- Maximo 2-3 oraciones

IMPORTANTE: Solo texto natural, sin JSON, sin markdown, sin backticks.`;
  }

  private getOfflineReflectionTip(habit: HabitWithStats): HabitRecommendation {
    const tips = OFFLINE_REFLECTION_TIPS[habit.category] ?? OFFLINE_REFLECTION_TIPS['custom'];
    const message = tips[Math.floor(Math.random() * tips.length)];
    return {
      id: 'offline_rec_' + Date.now(),
      habitId: habit.id,
      title: 'Consejo del dia',
      message,
      type: 'tip',
      createdAt: new Date(),
    };
  }

  private getOfflineMissedNudge(habit: HabitWithStats): HabitRecommendation {
    const nudges = OFFLINE_MISSED_NUDGES[habit.category] ?? OFFLINE_MISSED_NUDGES['custom'];
    const message = nudges[Math.floor(Math.random() * nudges.length)];
    return {
      id: 'offline_nudge_' + Date.now(),
      habitId: habit.id,
      title: 'Un recordatorio amigable',
      message,
      type: 'encouragement',
      createdAt: new Date(),
    };
  }

  private getOfflineInsight(previousMessage?: string, context?: AIPromptContext): AIInsight {
    if (context) {
      return this.buildContextualFallbackInsight(context, previousMessage);
    }

    const filtered = OFFLINE_INSIGHTS.filter(i =>
      !this.isSameInsightMessage(i.message, previousMessage)
    );
    const pool = filtered.length > 0 ? filtered : OFFLINE_INSIGHTS;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return {
      ...picked,
      id: 'offline_' + Date.now(),
      createdAt: new Date(),
    };
  }

  private buildContextualFallbackInsight(context: AIPromptContext, previousMessage?: string): AIInsight {
    if (context.habits.length === 0) {
      return this.getOfflineInsight(previousMessage);
    }

    const habitsByRate = [...context.habits].sort((a, b) => b.completionRate - a.completionRate);
    const habitsByStreak = [...context.habits].sort((a, b) => b.streak - a.streak);
    const bestRateHabit = habitsByRate[0];
    const riskHabit = habitsByRate[habitsByRate.length - 1];
    const bestStreakHabit = habitsByStreak[0];

    const candidates: AIInsight[] = [
      {
        id: 'ctx_1',
        type: 'positive_trend',
        title: 'Tendencia positiva',
        message: `Tu habito \"${bestRateHabit.title}\" lidera con ${bestRateHabit.completionRate}% de cumplimiento. Mantener ese ritmo puede impulsar al resto de tus habitos.`,
        createdAt: new Date(),
      },
      {
        id: 'ctx_2',
        type: 'streak_risk',
        title: 'Zona de atencion',
        message: `\"${riskHabit.title}\" va mas atras con ${riskHabit.completionRate}%. Si lo refuerzas hoy, reduces riesgo de romper consistencia semanal.`,
        createdAt: new Date(),
      },
      {
        id: 'ctx_3',
        type: 'weekly_summary',
        title: 'Resumen rapido',
        message: `Llevas ${context.recentCompletions} completados recientes y tu mejor racha actual es ${bestStreakHabit.streak} dias en \"${bestStreakHabit.title}\".`,
        createdAt: new Date(),
      },
      {
        id: 'ctx_4',
        type: 'habit_correlation',
        title: 'Palanca de progreso',
        message: `Prioriza primero \"${bestRateHabit.title}\" para generar inercia; los habitos con mayor cumplimiento suelen arrastrar mejoras en los que van rezagados.`,
        createdAt: new Date(),
      },
    ];

    const filtered = candidates.filter(c =>
      !this.isSameInsightMessage(c.message, previousMessage)
    );
    const pool = filtered.length > 0 ? filtered : candidates;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return {
      ...picked,
      id: 'ctx_' + Date.now(),
      createdAt: new Date(),
    };
  }

  private isSameInsightMessage(message: string, previousMessage?: string): boolean {
    if (!previousMessage) return false;
    const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
    return normalize(message) === normalize(previousMessage);
  }
}
