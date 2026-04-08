import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Challenge } from '../../../../models/gamification.model';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-challenge-card',
  standalone: true,
  imports: [ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="card p-4 border-l-4 transition-all"
      [class]="challenge().isCompleted ? 'border-l-green-500 bg-green-50/50' : 'border-l-indigo-500'">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">{{ getTypeIcon() }}</span>
            <h3 class="text-sm font-semibold text-gray-900">{{ challenge().title }}</h3>
          </div>
          <p class="text-xs text-gray-500 mb-3">{{ challenge().description }}</p>

          <!-- Progress -->
          <div class="mb-2">
            <app-progress-bar
              [value]="progressPercent()"
              [showLabel]="false"
              size="sm"
              [color]="challenge().isCompleted ? 'green' : 'indigo'" />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">
              {{ challenge().progress }}/{{ challenge().requirement.value }}
            </span>
            <span class="text-xs text-gray-400">{{ getDaysRemaining() }}</span>
          </div>
        </div>

        <!-- Rewards -->
        <div class="flex flex-col items-end gap-1 flex-shrink-0">
          @if (challenge().isCompleted) {
            <span class="badge badge-success text-xs">Completado</span>
          } @else {
            <div class="text-right">
              <p class="text-xs font-semibold text-indigo-600">+{{ challenge().xpReward }} XP</p>
              @if (challenge().pointsReward > 0) {
                <p class="text-xs font-medium text-amber-600">+{{ challenge().pointsReward }} pts</p>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ChallengeCardComponent {
  challenge = input.required<Challenge>();

  progressPercent(): number {
    const c = this.challenge();
    if (c.requirement.value === 0) return 100;
    return Math.min(100, Math.round((c.progress / c.requirement.value) * 100));
  }

  getTypeIcon(): string {
    switch (this.challenge().type) {
      case 'weekly': return '📅';
      case 'monthly': return '🗓️';
      case 'special': return '⭐';
      default: return '🎯';
    }
  }

  getDaysRemaining(): string {
    const end = new Date(this.challenge().endDate);
    const now = new Date();
    const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    if (this.challenge().isCompleted) return '';
    if (days === 0) return 'Ultimo dia';
    if (days === 1) return '1 dia restante';
    return `${days} dias restantes`;
  }
}
