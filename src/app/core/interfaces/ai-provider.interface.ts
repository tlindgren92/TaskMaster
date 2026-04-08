import { Observable } from 'rxjs';
import { AIProviderConfig, AIResponse, AIConversationMessage } from '../../models/ai.model';

export interface AIValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
  details?: string;
}

/**
 * Interfaz abstracta para proveedores de IA.
 * Cualquier proveedor (Anthropic, Gemini, OpenAI, etc.) debe implementar esta interfaz.
 */
export interface IAIProvider {
  readonly providerName: string;

  sendMessage(
    systemPrompt: string,
    userMessage: string,
    config: AIProviderConfig,
  ): Observable<AIResponse>;

  sendConversation(
    systemPrompt: string,
    messages: AIConversationMessage[],
    config: AIProviderConfig,
  ): Observable<AIResponse>;

  validateApiKey(apiKey: string, model: string): Observable<AIValidationResult>;
}
