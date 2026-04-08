import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import {
  AISuggestion,
  AIInsight,
  AIConversationMessage,
  AIPromptContext,
  AIProviderType,
  AIResponse,
  OFFLINE_INSIGHTS,
  OFFLINE_MOTIVATIONAL,
} from '../../models/ai.model';
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

  readonly suggestions = this._suggestions.asReadonly();
  readonly dailyInsight = this._dailyInsight.asReadonly();
  readonly chatMessages = this._chatMessages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly chatLoading = this._chatLoading.asReadonly();
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
    const config = this.configService.activeProviderConfig();
    if (!config) {
      this._dailyInsight.set(this.getOfflineInsight());
      return;
    }

    this._loading.set(true);

    const systemPrompt = this.buildSystemPrompt();
    const userMessage = this.buildInsightPrompt(context);

    this.getProvider().sendMessage(systemPrompt, userMessage, config).pipe(
      tap(response => {
        const insight = this.parseInsightResponse(response);
        this._dailyInsight.set(insight);
        this._loading.set(false);
      }),
      catchError(() => {
        this._dailyInsight.set(this.getOfflineInsight());
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
        const assistantMsg: AIConversationMessage = {
          role: 'assistant',
          content: response.content,
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

  // ─── Motivational (offline) ──────────────────────────────────

  getMotivationalMessage(): string {
    return OFFLINE_MOTIVATIONAL[Math.floor(Math.random() * OFFLINE_MOTIVATIONAL.length)];
  }

  // ─── Validate API Key ────────────────────────────────────────

  validateApiKey(provider: AIProviderType, apiKey: string, model: string): Observable<AIValidationResult> {
    return this.getProvider(provider).validateApiKey(apiKey, model);
  }

  // ─── Private: Prompt builders ────────────────────────────────

  private buildSystemPrompt(): string {
    return `Eres un coach de habitos inteligente y motivador integrado en la app "TaskMaster".
Tu rol es ayudar al usuario a mejorar sus habitos, adoptar nuevos habitos positivos y dejar malos habitos.

Reglas:
- Responde SIEMPRE en espanol
- Se conciso, maximo 2-3 parrafos
- Usa un tono amigable, motivador pero no condescendiente
- Basa tus consejos en evidencia cientifica cuando sea posible
- Personaliza las respuestas segun el contexto del usuario (sus habitos, rachas, nivel)
- Nunca inventes datos del usuario, usa solo lo que se te proporciona`;
  }

  private buildCoachSystemPrompt(context: AIPromptContext): string {
    return `${this.buildSystemPrompt()}

Contexto actual del usuario:
- Nivel: ${context.currentLevel}
- Dia: ${context.dayOfWeek}
- Completados recientes: ${context.recentCompletions}
- Objetivos: ${context.userGoals.join(', ') || 'No definidos'}
- Habitos activos:
${context.habits.map(h => `  * ${h.title} (${h.category}, ${h.type}) - Racha: ${h.streak} dias, Completado: ${h.completionRate}%`).join('\n')}`;
  }

  private buildInsightPrompt(context: AIPromptContext): string {
    return `Genera un insight diario personalizado para el usuario.

Contexto:
- Dia: ${context.dayOfWeek}
- Nivel: ${context.currentLevel}
- Completados recientes: ${context.recentCompletions}
- Objetivos: ${context.userGoals.join(', ') || 'No definidos'}
- Habitos: ${context.habits.map(h => `${h.title} (racha ${h.streak}, ${h.completionRate}% completado)`).join('; ')}

IMPORTANTE: Responde UNICAMENTE con el JSON puro, sin bloques de codigo markdown, sin backticks, sin texto adicional:
{"title": "titulo corto del insight", "message": "mensaje de 1-2 oraciones maximo", "type": "positive_trend|streak_risk|habit_correlation|optimal_time|weekly_summary"}`;
  }

  private buildSuggestionsPrompt(context: AIPromptContext): string {
    return `Sugiere 2-3 habitos que complementen los habitos actuales del usuario.

Contexto:
- Objetivos: ${context.userGoals.join(', ') || 'Mejorar en general'}
- Habitos actuales: ${context.habits.map(h => `${h.title} (${h.category})`).join(', ') || 'Ninguno'}
- Nivel: ${context.currentLevel}

IMPORTANTE: Responde UNICAMENTE con el JSON puro, sin bloques de codigo markdown, sin backticks, sin texto adicional:
[{"title": "titulo del habito sugerido", "description": "por que este habito le beneficiaria (1 oracion)", "type": "new_habit|improvement"}]`;
  }

  // ─── Private: Response parsers ───────────────────────────────

  /**
   * Limpia bloques de codigo markdown (```json ... ```) del contenido de la respuesta.
   */
  private stripMarkdownCodeBlocks(content: string): string {
    return content
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  private parseInsightResponse(response: AIResponse): AIInsight {
    try {
      const cleaned = this.stripMarkdownCodeBlocks(response.content);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: 'ai_' + Date.now(),
          type: parsed.type || 'positive_trend',
          title: parsed.title || 'Insight del dia',
          message: parsed.message || response.content,
          createdAt: new Date(),
        };
      }
    } catch (e) {
      console.warn('[AI] Failed to parse insight JSON:', e, response.content);
    }

    return {
      id: 'ai_' + Date.now(),
      type: 'positive_trend',
      title: 'Insight del dia',
      message: this.stripMarkdownCodeBlocks(response.content).slice(0, 200),
      createdAt: new Date(),
    };
  }

  private parseSuggestionsResponse(response: AIResponse): AISuggestion[] {
    try {
      const cleaned = this.stripMarkdownCodeBlocks(response.content);
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as { title: string; description: string; type: string }[];
        return parsed.map((s, i) => ({
          id: `suggestion_${Date.now()}_${i}`,
          type: (s.type as AISuggestion['type']) || 'new_habit',
          title: s.title,
          description: s.description,
          confidence: 0.8,
          createdAt: new Date(),
          isDismissed: false,
        }));
      }
    } catch (e) {
      console.warn('[AI] Failed to parse suggestions JSON:', e, response.content);
    }

    return [{
      id: `suggestion_${Date.now()}`,
      type: 'new_habit',
      title: 'Sugerencia',
      description: this.stripMarkdownCodeBlocks(response.content).slice(0, 200),
      confidence: 0.5,
      createdAt: new Date(),
      isDismissed: false,
    }];
  }

  private getOfflineInsight(): AIInsight {
    const insights = OFFLINE_INSIGHTS;
    return { ...insights[Math.floor(Math.random() * insights.length)], id: 'offline_' + Date.now() };
  }
}
