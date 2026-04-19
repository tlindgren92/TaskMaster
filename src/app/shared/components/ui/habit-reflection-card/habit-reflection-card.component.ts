import { Component, inject, input, output, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AIService } from '../../../../core/services/ai.service';
import { AIConfigService } from '../../../../core/services/ai-config.service';
import { HabitWithStats } from '../../../../models/habit.model';
import { REFLECTION_PROMPTS } from '../../../../models/ai.model';

@Component({
  selector: 'app-habit-reflection-card',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 overflow-hidden animate-slideDown">
      <div class="p-4">
        @if (!showRecommendation()) {
          <!-- Reflection input -->
          <div class="flex items-start gap-3">
            <span class="text-xl flex-shrink-0 mt-0.5">{{ reflectionIcon() }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-purple-700 mb-2">{{ reflectionPlaceholder() }}</p>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="reflectionText"
                  [placeholder]="'Escribe algo breve...'"
                  class="flex-1 text-sm px-3 py-1.5 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                  (keyup.enter)="submitReflection()" />
                <button
                  (click)="submitReflection()"
                  class="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                  Enviar
                </button>
              </div>
              <button
                (click)="skipReflection()"
                class="text-xs text-purple-400 hover:text-purple-600 mt-1.5 transition-colors">
                Saltar y ver consejo
              </button>
            </div>
          </div>
        } @else {
          <!-- Recommendation display -->
          <div class="flex items-start gap-3">
            <span class="text-xl flex-shrink-0 mt-0.5">
              {{ aiService.recommendationLoading() ? '...' : '💡' }}
            </span>
            <div class="flex-1 min-w-0">
              @if (aiService.recommendationLoading()) {
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <span class="text-xs text-purple-500">Generando recomendacion...</span>
                </div>
              } @else if (aiService.activeRecommendation()) {
                <p class="text-xs font-semibold text-purple-800 mb-1">{{ aiService.activeRecommendation()!.title }}</p>
                <p class="text-sm text-purple-700 leading-relaxed">{{ aiService.activeRecommendation()!.message }}</p>
              }
            </div>
          </div>
          <!-- Close button -->
          <div class="flex justify-end mt-2">
            <button
              (click)="close()"
              class="text-xs text-purple-400 hover:text-purple-600 transition-colors">
              Cerrar
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class HabitReflectionCardComponent implements OnInit, OnDestroy {
  habit = input.required<HabitWithStats>();
  closed = output<void>();

  aiService = inject(AIService);
  private aiConfigService = inject(AIConfigService);

  reflectionText = '';
  showRecommendation = signal(false);

  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly reflectionPlaceholder = computed(() => {
    const h = this.habit();
    const prompts = REFLECTION_PROMPTS[h.category] ?? REFLECTION_PROMPTS['custom'];
    return prompts[h.type]?.placeholder ?? 'Como te fue hoy?';
  });

  readonly reflectionIcon = computed(() => {
    const h = this.habit();
    const prompts = REFLECTION_PROMPTS[h.category] ?? REFLECTION_PROMPTS['custom'];
    return prompts[h.type]?.icon ?? '✨';
  });

  ngOnInit(): void {
    // Auto-close after 30 seconds if user doesn't interact
    this.autoCloseTimer = setTimeout(() => this.close(), 30000);
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
  }

  submitReflection(): void {
    this.resetAutoClose();
    this.showRecommendation.set(true);
    this.aiService.generateHabitRecommendation(this.habit(), this.reflectionText.trim() || undefined);
    this.scheduleAutoClose(15000);
  }

  skipReflection(): void {
    this.resetAutoClose();
    this.showRecommendation.set(true);
    this.aiService.generateHabitRecommendation(this.habit());
    this.scheduleAutoClose(15000);
  }

  close(): void {
    this.resetAutoClose();
    this.aiService.dismissRecommendation();
    this.closed.emit();
  }

  private scheduleAutoClose(ms: number): void {
    this.autoCloseTimer = setTimeout(() => this.close(), ms);
  }

  private resetAutoClose(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }
}
