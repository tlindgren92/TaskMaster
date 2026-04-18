import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, switchMap, forkJoin } from 'rxjs';
import {
  AISuggestion,
  AIInsight,
  AIConversationMessage,
  AIPromptContext,
  AIProviderType,
  AIProviderConfig,
  AIResponse,
  AIToolResult,
  AIActionChip,
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
import { HabitInsightEngineService } from './habit-insight-engine.service';
import { AIActionDispatcherService } from './ai-action-dispatcher.service';
import { AI_TOOL_CATALOG } from '../providers/ai/tools';
import {
  buildCoachSystemPrompt,
  COACH_BASE_SYSTEM,
  RECOMMENDATION_BASE_SYSTEM,
  buildInsightPrompt,
  buildSuggestionsPrompt,
  buildRecommendationPrompt,
  buildMissedHabitPrompt,
} from '../prompts';

const CHAT_TOOL_MAX_TOKENS = 2048;
const MAX_TOOL_TURNS = 5;

@Injectable({ providedIn: 'root' })
export class AIService {
  private anthropicProvider = inject(AnthropicProvider);
  private geminiProvider = inject(GeminiProvider);
  private configService = inject(AIConfigService);
  private notificationService = inject(NotificationService);
  private insightEngine = inject(HabitInsightEngineService);
  private actionDispatcher = inject(AIActionDispatcherService);

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

    const snapshot = this.insightEngine.snapshot();
    const systemPrompt = COACH_BASE_SYSTEM;
    const userMessage = buildInsightPrompt(context, previousMessage, snapshot);

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

    const snapshot = this.insightEngine.snapshot();
    const systemPrompt = COACH_BASE_SYSTEM;
    const userMessage = buildSuggestionsPrompt(context, snapshot);

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

  // ─── Coach Chat (con tool-use) ───────────────────────────────

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

    const snapshot = this.insightEngine.snapshot();
    const systemPrompt = buildCoachSystemPrompt(context, snapshot);
    const toolConfig: AIProviderConfig = { ...config, maxTokens: Math.max(config.maxTokens, CHAT_TOOL_MAX_TOKENS) };

    this.runToolLoop(systemPrompt, toolConfig, 0).subscribe({
      next: () => this._chatLoading.set(false),
      error: () => {
        const fallbackMsg: AIConversationMessage = {
          role: 'assistant',
          content: this.getMotivationalMessage(),
          timestamp: new Date(),
        };
        this._chatMessages.update(msgs => [...msgs, fallbackMsg]);
        this._chatLoading.set(false);
      },
    });
  }

  private runToolLoop(systemPrompt: string, config: AIProviderConfig, turn: number): Observable<void> {
    if (turn >= MAX_TOOL_TURNS) {
      const cappedMsg: AIConversationMessage = {
        role: 'assistant',
        content: 'Alcance el limite de acciones por turno. Dime si quieres que continue con algo especifico.',
        timestamp: new Date(),
      };
      this._chatMessages.update(msgs => [...msgs, cappedMsg]);
      return of(undefined);
    }

    const messages = this._chatMessages();
    return this.getProvider().sendConversationWithTools(systemPrompt, messages, AI_TOOL_CATALOG, config).pipe(
      switchMap(response => {
        const cleanContent = this.sanitizeAIResponse(response.content);
        const toolCalls = response.toolCalls ?? [];

        const assistantMsg: AIConversationMessage = {
          role: 'assistant',
          content: cleanContent || response.content || '',
          timestamp: new Date(),
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        };

        if (toolCalls.length === 0) {
          this._chatMessages.update(msgs => [...msgs, assistantMsg]);
          return of(undefined);
        }

        return forkJoin(toolCalls.map(call => this.actionDispatcher.execute(call))).pipe(
          switchMap(outcomes => {
            const chips: AIActionChip[] = outcomes.map(o => o.chip);
            const toolResults: AIToolResult[] = outcomes.map(o => o.toolResult);

            this._chatMessages.update(msgs => [
              ...msgs,
              { ...assistantMsg, actionChips: chips },
            ]);

            const toolResultMsg: AIConversationMessage = {
              role: 'user',
              content: '',
              timestamp: new Date(),
              toolResults,
            };
            this._chatMessages.update(msgs => [...msgs, toolResultMsg]);

            if (response.stopReason !== 'tool_use') {
              return of(undefined);
            }
            return this.runToolLoop(systemPrompt, config, turn + 1);
          }),
        );
      }),
    );
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

    const systemPrompt = RECOMMENDATION_BASE_SYSTEM;
    const userMessage = buildRecommendationPrompt(habit, reflection);

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

    const systemPrompt = RECOMMENDATION_BASE_SYSTEM;
    const userMessage = buildMissedHabitPrompt(habit);

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

  getMotivationalMessage(): string {
    return OFFLINE_MOTIVATIONAL[Math.floor(Math.random() * OFFLINE_MOTIVATIONAL.length)];
  }

  validateApiKey(provider: AIProviderType, apiKey: string, model: string): Observable<AIValidationResult> {
    return this.getProvider(provider).validateApiKey(apiKey, model);
  }

  // ─── Response parsing helpers ────────────────────────────────

  private sanitizeAIResponse(content: string): string {
    if (!content?.trim()) return '';

    let cleaned = content;
    const codeBlockMatch = cleaned.match(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1];
    }
    cleaned = cleaned.replace(/`/g, '');
    return cleaned.trim();
  }

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
