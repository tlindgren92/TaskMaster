import { Component, inject, input, output, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AIService } from '../../../../core/services/ai.service';
import { HabitWithStats } from '../../../../models/habit.model';

@Component({
  selector: 'app-missed-habit-nudge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-2 rounded-xl bg-amber-50 border border-amber-100 overflow-hidden animate-slideDown">
      <div class="p-4">
        <div class="flex items-start gap-3">
          <span class="text-xl flex-shrink-0 mt-0.5">💚</span>
          <div class="flex-1 min-w-0">
            @if (aiService.recommendationLoading()) {
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                <span class="text-xs text-amber-600">Pensando en ti...</span>
              </div>
            } @else if (aiService.activeRecommendation()) {
              <p class="text-xs font-semibold text-amber-800 mb-1">{{ aiService.activeRecommendation()!.title }}</p>
              <p class="text-sm text-amber-700 leading-relaxed">{{ aiService.activeRecommendation()!.message }}</p>
            }
          </div>
        </div>
        <div class="flex justify-end mt-2">
          <button
            (click)="dismiss()"
            class="text-xs font-medium text-amber-500 hover:text-amber-700 transition-colors">
            Entendido
          </button>
        </div>
      </div>
    </div>
  `,
})
export class MissedHabitNudgeComponent implements OnInit {
  habit = input.required<HabitWithStats>();
  dismissed = output<void>();

  aiService = inject(AIService);

  private readonly SESSION_KEY_PREFIX = 'nudge_shown_';

  ngOnInit(): void {
    this.aiService.generateMissedHabitNudge(this.habit());
    this.markShownInSession();
  }

  dismiss(): void {
    this.aiService.dismissRecommendation();
    this.dismissed.emit();
  }

  private markShownInSession(): void {
    sessionStorage.setItem(this.SESSION_KEY_PREFIX + this.habit().id, 'true');
  }

  static wasShownThisSession(habitId: string): boolean {
    return sessionStorage.getItem('nudge_shown_' + habitId) === 'true';
  }
}
