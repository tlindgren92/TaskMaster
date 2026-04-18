import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { IAIProvider, AIValidationResult } from '../../interfaces/ai-provider.interface';
import {
  AIProviderConfig,
  AIResponse,
  AIConversationMessage,
  AIToolCall,
  AIToolDefinition,
} from '../../../models/ai.model';
import { toGeminiTools } from './tools';

@Injectable({ providedIn: 'root' })
export class GeminiProvider implements IAIProvider {
  private http = inject(HttpClient);
  readonly providerName = 'Google Gemini';

  private readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  sendMessage(
    systemPrompt: string,
    userMessage: string,
    config: AIProviderConfig,
  ): Observable<AIResponse> {
    return this.sendConversation(
      systemPrompt,
      [{ role: 'user', content: userMessage, timestamp: new Date() }],
      config,
    );
  }

  sendConversation(
    systemPrompt: string,
    messages: AIConversationMessage[],
    config: AIProviderConfig,
  ): Observable<AIResponse> {
    return this.post(systemPrompt, messages, [], config);
  }

  sendConversationWithTools(
    systemPrompt: string,
    messages: AIConversationMessage[],
    tools: AIToolDefinition[],
    config: AIProviderConfig,
  ): Observable<AIResponse> {
    return this.post(systemPrompt, messages, tools, config);
  }

  private post(
    systemPrompt: string,
    messages: AIConversationMessage[],
    tools: AIToolDefinition[],
    config: AIProviderConfig,
  ): Observable<AIResponse> {
    const url = `${this.BASE_URL}/${config.model}:generateContent?key=${config.apiKey}`;
    const contents = messages.map(m => this.toGeminiMessage(m));

    const body: Record<string, unknown> = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: 0.7,
      },
    };
    if (tools.length > 0) {
      body['tools'] = toGeminiTools(tools);
    }

    return this.http.post<GeminiResponse>(url, body).pipe(
      map(response => this.parseResponse(response, config)),
    );
  }

  private toGeminiMessage(m: AIConversationMessage): unknown {
    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      const parts: unknown[] = [];
      if (m.content) parts.push({ text: m.content });
      for (const call of m.toolCalls) {
        parts.push({ functionCall: { name: call.name, args: call.args } });
      }
      return { role: 'model', parts };
    }

    if (m.role === 'user' && m.toolResults && m.toolResults.length > 0) {
      const parts = m.toolResults.map(tr => ({
        functionResponse: {
          name: tr.toolName,
          response: this.parseToolResultContent(tr.content, tr.isError),
        },
      }));
      return { role: 'user', parts };
    }

    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    };
  }

  private parseToolResultContent(content: string, isError?: boolean): Record<string, unknown> {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return isError ? { error: parsed } : (parsed as Record<string, unknown>);
      }
    } catch {
      // fall through
    }
    return isError ? { error: content } : { result: content };
  }

  private parseResponse(response: GeminiResponse, config: AIProviderConfig): AIResponse {
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const textParts = parts.filter(p => typeof p.text === 'string');
    const callParts = parts.filter(p => p.functionCall);

    const content = textParts.map(p => p.text ?? '').join('\n').trim();
    const toolCalls: AIToolCall[] = callParts.map((p, i) => ({
      id: `gemini_call_${Date.now()}_${i}`,
      name: p.functionCall!.name,
      args: (p.functionCall!.args ?? {}) as Record<string, unknown>,
    }));

    const finish = response.candidates?.[0]?.finishReason;
    const stopReason: AIResponse['stopReason'] = toolCalls.length > 0
      ? 'tool_use'
      : this.mapFinishReason(finish);

    return {
      content,
      provider: 'gemini',
      model: config.model,
      tokensUsed: response.usageMetadata?.totalTokenCount,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason,
    };
  }

  private mapFinishReason(reason?: string): AIResponse['stopReason'] {
    switch (reason) {
      case 'STOP': return 'end_turn';
      case 'MAX_TOKENS': return 'max_tokens';
      default: return 'other';
    }
  }

  validateApiKey(apiKey: string, model: string): Observable<AIValidationResult> {
    const url = `${this.BASE_URL}/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      generationConfig: { maxOutputTokens: 10 },
    };

    return this.http.post(url, body).pipe(
      map(() => ({ valid: true } as AIValidationResult)),
      catchError((err: HttpErrorResponse) => {
        const result = this.parseGeminiError(err);
        console.error('[Gemini] Validation failed:', {
          status: err.status,
          statusText: err.statusText,
          url: url.replace(apiKey, apiKey.substring(0, 8) + '***'),
          error: err.error,
        });
        return of(result);
      }),
    );
  }

  private parseGeminiError(err: HttpErrorResponse): AIValidationResult {
    const status = err.status;

    const apiError = err.error?.error;
    const apiMessage = apiError?.message ?? err.message ?? 'Error desconocido';
    const apiStatus = apiError?.status ?? '';

    if (status === 0) {
      return {
        valid: false,
        statusCode: 0,
        error: 'Error de red',
        details: 'No se pudo conectar con la API de Google. Verifica tu conexion a internet y que no haya un bloqueador (CORS, firewall, VPN).',
      };
    }

    if (status === 400) {
      if (apiMessage.includes('API_KEY_INVALID') || apiStatus === 'INVALID_ARGUMENT') {
        return {
          valid: false, statusCode: 400,
          error: 'API Key invalida',
          details: `La key proporcionada no es valida. Verifica que la copiaste correctamente desde Google AI Studio. Detalle: ${apiMessage}`,
        };
      }
      return {
        valid: false, statusCode: 400,
        error: 'Solicitud invalida',
        details: `El modelo o la solicitud tiene un error. Detalle: ${apiMessage}`,
      };
    }

    if (status === 403) {
      return {
        valid: false, statusCode: 403,
        error: 'Acceso denegado',
        details: `La API key no tiene permisos para usar este modelo. Verifica que la API de Gemini este habilitada en tu proyecto de Google Cloud. Detalle: ${apiMessage}`,
      };
    }

    if (status === 404) {
      return {
        valid: false, statusCode: 404,
        error: 'Modelo no encontrado',
        details: `El modelo "${apiMessage}" no existe o no esta disponible. Intenta con otro modelo.`,
      };
    }

    if (status === 429) {
      return {
        valid: false, statusCode: 429,
        error: 'Limite de uso excedido',
        details: `Has superado el limite de solicitudes. Espera un momento e intenta de nuevo. Detalle: ${apiMessage}`,
      };
    }

    return {
      valid: false,
      statusCode: status,
      error: `Error HTTP ${status}`,
      details: apiMessage,
    };
  }
}

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args?: Record<string, unknown>;
  };
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: GeminiPart[];
      role: string;
    };
    finishReason?: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
