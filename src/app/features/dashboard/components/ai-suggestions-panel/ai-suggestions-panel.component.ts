import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AIService } from '../../../../core/services/ai.service';
import { AIConfigService } from '../../../../core/services/ai-config.service';
import { HabitService } from '../../../../core/services/habit.service';
import { UserService } from '../../../../core/services/user.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import { AIPromptContext } from '../../../../models/ai.model';

@Component({
  selector: 'app-ai-suggestions-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (aiConfigService.isConfigured()) {
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg">🤖</span>
            <h2 class="text-base font-semibold text-gray-900">Sugerencias IA</h2>
          </div>
          <button
            (click)="generate()"
            [disabled]="aiService.loading()"
            class="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50">
            {{ activeSuggestions().length > 0 ? 'Regenerar' : 'Generar' }}
          </button>
        </div>

        @if (aiService.loading()) {
          <div class="flex items-center gap-3 py-4 justify-center">
            <div class="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <span class="text-sm text-gray-500">Pensando sugerencias...</span>
          </div>
        } @else if (activeSuggestions().length > 0) {
          <div class="space-y-3">
            @for (suggestion of activeSuggestions(); track suggestion.id) {
              <div class="flex items-start gap-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                <span class="text-lg flex-shrink-0 mt-0.5">
                  {{ suggestion.type === 'new_habit' ? '🌱' : '💡' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900">{{ suggestion.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ suggestion.description }}</p>
                </div>
                <button
                  (click)="dismiss(suggestion.id)"
                  class="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        } @else {
          <p class="text-sm text-gray-400 text-center py-3">
            Pulsa "Generar" para obtener sugerencias personalizadas
          </p>
        }
      </div>
    }
  `,
})
export class AISuggestionsPanelComponent {
  aiService = inject(AIService);
  aiConfigService = inject(AIConfigService);
  private habitService = inject(HabitService);
  private userService = inject(UserService);
  private gamificationService = inject(GamificationService);

  activeSuggestions() {
    return this.aiService.suggestions().filter(s => !s.isDismissed);
  }

  generate(): void {
    this.aiService.generateSuggestions(this.buildContext());
  }

  dismiss(id: string): void {
    this.aiService.dismissSuggestion(id);
  }

  private buildContext(): AIPromptContext {
    const habits = this.habitService.habitsWithStats();
    return {
      habits: habits.map(h => ({
        title: h.title,
        category: h.category,
        type: h.type,
        streak: h.streak.currentStreak,
        completionRate: h.completionRate,
      })),
      userGoals: this.userService.profile()?.goals ?? [],
      recentCompletions: this.habitService.completions().length,
      currentLevel: this.gamificationService.userLevel().level,
      dayOfWeek: new Date().toLocaleDateString('es-ES', { weekday: 'long' }),
    };
  }
}
