import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AIService } from '../../../../core/services/ai.service';
import { AIConfigService } from '../../../../core/services/ai-config.service';
import { HabitService } from '../../../../core/services/habit.service';
import { UserService } from '../../../../core/services/user.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import { AIPromptContext, AI_PROVIDER_LABELS } from '../../../../models/ai.model';

@Component({
  selector: 'app-ai-insight-card',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card overflow-hidden">
      <!-- Gradient top -->
      <div class="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"></div>

      <div class="p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <span class="text-sm font-semibold text-gray-900">Coach IA</span>
            @if (aiConfigService.isConfigured()) {
              <span class="text-xs text-purple-500 font-medium">{{ getProviderLabel() }}</span>
            }
          </div>
          @if (aiConfigService.isConfigured()) {
            <button
              (click)="refresh()"
              class="p-1.5 text-gray-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
              [class.animate-pulse-slow]="aiService.loading()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          }
        </div>

        @if (!aiConfigService.isConfigured()) {
          <!-- No API key configured -->
          <div class="text-center py-2">
            <p class="text-sm text-gray-500 mb-2">Conecta tu IA para obtener insights personalizados</p>
            <a routerLink="/profile" class="text-sm font-medium text-purple-600 hover:text-purple-700">
              Configurar API key
            </a>
          </div>
        } @else if (aiService.loading()) {
          <!-- Loading -->
          <div class="flex items-center gap-3 py-2">
            <div class="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <span class="text-sm text-gray-500">Generando insight...</span>
          </div>
        } @else if (aiService.dailyInsight()) {
          <!-- Insight content -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-base">{{ getInsightIcon(aiService.dailyInsight()!.type) }}</span>
              <h3 class="text-sm font-semibold text-gray-900">{{ aiService.dailyInsight()!.title }}</h3>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">{{ aiService.dailyInsight()!.message }}</p>
          </div>
        } @else {
          <!-- Fallback motivational -->
          <p class="text-sm text-gray-600 italic leading-relaxed">
            "{{ aiService.getMotivationalMessage() }}"
          </p>
        }
      </div>
    </div>
  `,
})
export class AIInsightCardComponent implements OnInit {
  aiService = inject(AIService);
  aiConfigService = inject(AIConfigService);
  private habitService = inject(HabitService);
  private userService = inject(UserService);
  private gamificationService = inject(GamificationService);

  ngOnInit(): void {
    if (this.aiConfigService.isConfigured()) {
      this.refresh();
    }
  }

  refresh(): void {
    if (this.habitService.loading()) {
      setTimeout(() => this.refresh(), 150);
      return;
    }
    this.aiService.generateDailyInsight(this.buildContext());
  }

  getProviderLabel(): string {
    return AI_PROVIDER_LABELS[this.aiConfigService.activeProvider()] ?? '';
  }

  getInsightIcon(type: string): string {
    const icons: Record<string, string> = {
      streak_risk: '⚠️',
      positive_trend: '📈',
      habit_correlation: '🔗',
      optimal_time: '⏰',
      weekly_summary: '📊',
    };
    return icons[type] ?? '💡';
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
