import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { IAIProvider, AIValidationResult } from '../../interfaces/ai-provider.interface';
import { AIProviderConfig, AIResponse, AIConversationMessage } from '../../../models/ai.model';

@Injectable({ providedIn: 'root' })
export class AnthropicProvider implements IAIProvider {
  private http = inject(HttpClient);
  readonly providerName = 'Anthropic Claude';

  private readonly API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly API_VERSION = '2023-06-01';

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
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': this.API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    });

    const body = {
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    };

    return this.http.post<AnthropicResponse>(this.API_URL, body, { headers }).pipe(
      map(response => ({
        content: response.content?.[0]?.text ?? '',
        provider: 'anthropic' as const,
        model: config.model,
        tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      })),
    );
  }

  validateApiKey(apiKey: string, model: string): Observable<AIValidationResult> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': this.API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    });

    const body = {
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    };

    return this.http.post(this.API_URL, body, { headers }).pipe(
      map(() => ({ valid: true } as AIValidationResult)),
      catchError((err: HttpErrorResponse) => {
        const result = this.parseAnthropicError(err);
        console.error('[Anthropic] Validation failed:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
        });
        return of(result);
      }),
    );
  }

  private parseAnthropicError(err: HttpErrorResponse): AIValidationResult {
    const status = err.status;
    const apiError = err.error?.error;
    const apiMessage = apiError?.message ?? err.message ?? 'Error desconocido';
    const apiType = apiError?.type ?? '';

    if (status === 0) {
      return {
        valid: false, statusCode: 0,
        error: 'Error de red / CORS',
        details: 'No se pudo conectar con la API de Anthropic. Esto puede deberse a restricciones CORS en el navegador. Verifica tu conexion y que no haya bloqueadores (VPN, firewall, extensiones).',
      };
    }

    if (status === 401) {
      return {
        valid: false, statusCode: 401,
        error: 'API Key invalida',
        details: `La key proporcionada no es valida o ha expirado. Verifica que la copiaste correctamente desde console.anthropic.com. Detalle: ${apiMessage}`,
      };
    }

    if (status === 403) {
      return {
        valid: false, statusCode: 403,
        error: 'Acceso denegado',
        details: `Tu cuenta no tiene permisos para usar este modelo. Verifica que tienes creditos disponibles y acceso al modelo ${apiType ? `(${apiType})` : ''}. Detalle: ${apiMessage}`,
      };
    }

    if (status === 404) {
      return {
        valid: false, statusCode: 404,
        error: 'Modelo no encontrado',
        details: `El modelo seleccionado no existe o no esta disponible para tu cuenta. Intenta con otro modelo. Detalle: ${apiMessage}`,
      };
    }

    if (status === 429) {
      return {
        valid: false, statusCode: 429,
        error: 'Limite de uso excedido',
        details: `Has superado el limite de solicitudes o tu cuota. Espera un momento e intenta de nuevo. Detalle: ${apiMessage}`,
      };
    }

    if (status === 529) {
      return {
        valid: false, statusCode: 529,
        error: 'API sobrecargada',
        details: `La API de Anthropic esta temporalmente sobrecargada. Intenta de nuevo en unos minutos. Detalle: ${apiMessage}`,
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

interface AnthropicResponse {
  content: { type: string; text: string }[];
  usage?: { input_tokens: number; output_tokens: number };
}
