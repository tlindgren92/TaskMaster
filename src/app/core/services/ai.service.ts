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

IMPORTANTE: Responde siempre en texto natural conversacional. NUNCA respondas con JSON, bloques de codigo, ni backticks. Tu respuesta debe ser texto plano legible.

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

  private parseInsightResponse(response: AIResponse): AIInsight {
    const cleaned = this.sanitizeAIResponse(response.content);

    try {
      const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (typeof parsed.title === 'string' && typeof parsed.message === 'string') {
          return {
            id: 'ai_' + Date.now(),
            type: parsed.type || 'positive_trend',
            title: parsed.title,
            message: parsed.message,
            createdAt: new Date(),
          };
        }
      }
    } catch (e) {
      console.warn('[AI] Parse insight failed:', e);
    }

    const plainText = this.extractPlainText(cleaned);
    return {
      id: 'ai_' + Date.now(),
      type: 'positive_trend',
      title: 'Insight del dia',
      message: plainText || 'Sigue construyendo tus habitos dia a dia.',
      createdAt: new Date(),
    };
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

  private getOfflineInsight(): AIInsight {
    const insights = OFFLINE_INSIGHTS;
    return { ...insights[Math.floor(Math.random() * insights.length)], id: 'offline_' + Date.now() };
  }
}
