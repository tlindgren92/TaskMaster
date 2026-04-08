import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { GamificationService } from '../../../../core/services/gamification.service';
import { getLevelProgress } from '../../../../core/utils/xp.utils';

@Component({
  selector: 'app-xp-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3">
      <!-- Level badge -->
      <div class="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
        {{ level().level }}
      </div>
      <!-- XP progress -->
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-baseline mb-1">
          <span class="text-sm font-semibold text-gray-900">{{ level().title }}</span>
          <span class="text-xs text-gray-500">{{ level().currentXP }}/{{ level().xpForNextLevel }} XP</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            [style.width.%]="progress()">
          </div>
        </div>
      </div>
    </div>
  `,
})
export class XpBarComponent {
  private gamificationService = inject(GamificationService);

  level = this.gamificationService.userLevel;
  progress = computed(() => getLevelProgress(this.level()));
}
