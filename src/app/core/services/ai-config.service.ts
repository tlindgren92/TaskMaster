import { Injectable, signal, computed } from '@angular/core';
import {
  AIProviderType,
  AIProviderConfig,
  AI_PROVIDER_DEFAULTS,
} from '../../models/ai.model';

const STORAGE_KEY = 'ai_config';

export interface StoredAIConfig {
  activeProvider: AIProviderType;
  providers: Partial<Record<AIProviderType, { apiKey: string; model: string }>>;
}

@Injectable({ providedIn: 'root' })
export class AIConfigService {
  private _config = signal<StoredAIConfig>(this.loadFromStorage());

  readonly config = this._config.asReadonly();

  readonly activeProvider = computed(() => this._config().activeProvider);

  readonly activeProviderConfig = computed<AIProviderConfig | null>(() => {
    const cfg = this._config();
    const providerData = cfg.providers[cfg.activeProvider];
    if (!providerData?.apiKey) return null;

    const defaults = AI_PROVIDER_DEFAULTS[cfg.activeProvider];
    return {
      provider: cfg.activeProvider,
      apiKey: providerData.apiKey,
      model: providerData.model || defaults.model,
      maxTokens: defaults.maxTokens,
    };
  });

  readonly isConfigured = computed(() => this.activeProviderConfig() !== null);

  readonly hasAnyKey = computed(() => {
    const cfg = this._config();
    return Object.values(cfg.providers).some(p => !!p?.apiKey);
  });

  getProviderConfig(provider: AIProviderType): AIProviderConfig | null {
    const cfg = this._config();
    const providerData = cfg.providers[provider];
    if (!providerData?.apiKey) return null;

    const defaults = AI_PROVIDER_DEFAULTS[provider];
    return {
      provider,
      apiKey: providerData.apiKey,
      model: providerData.model || defaults.model,
      maxTokens: defaults.maxTokens,
    };
  }

  setActiveProvider(provider: AIProviderType): void {
    this._config.update(cfg => ({ ...cfg, activeProvider: provider }));
    this.saveToStorage();
  }

  setApiKey(provider: AIProviderType, apiKey: string): void {
    this._config.update(cfg => ({
      ...cfg,
      providers: {
        ...cfg.providers,
        [provider]: {
          ...cfg.providers[provider],
          apiKey,
          model: cfg.providers[provider]?.model || AI_PROVIDER_DEFAULTS[provider].model,
        },
      },
    }));
    this.saveToStorage();
  }

  setModel(provider: AIProviderType, model: string): void {
    this._config.update(cfg => ({
      ...cfg,
      providers: {
        ...cfg.providers,
        [provider]: {
          ...cfg.providers[provider],
          apiKey: cfg.providers[provider]?.apiKey || '',
          model,
        },
      },
    }));
    this.saveToStorage();
  }

  removeApiKey(provider: AIProviderType): void {
    this._config.update(cfg => {
      const providers = { ...cfg.providers };
      delete providers[provider];
      return { ...cfg, providers };
    });
    this.saveToStorage();
  }

  private loadFromStorage(): StoredAIConfig {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      activeProvider: 'gemini',
      providers: {},
    };
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._config()));
  }
}
