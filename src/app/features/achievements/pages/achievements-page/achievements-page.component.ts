import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GamificationService } from '../../../../core/services/gamification.service';
import { XpBarComponent } from '../../../../shared/components/ui/xp-bar/xp-bar.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { Achievement, ACHIEVEMENT_CATEGORY_LABELS, AchievementCategory } from '../../../../models/gamification.model';

@Component({
  selector: 'app-achievements-page',
  standalone: true,
  imports: [XpBarComponent, ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Logros</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ gamificationService.unlockedAchievements().length }} de {{ gamificationService.achievements().length }} desbloqueados
        </p>
      </div>

      <!-- Level card -->
      <div class="card p-5">
        <app-xp-bar />
      </div>

      <!-- Overall progress -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-base font-semibold text-gray-900">Progreso total</h2>
          <span class="text-sm font-medium text-indigo-600">{{ gamificationService.achievementProgress() }}%</span>
        </div>
        <app-progress-bar [value]="gamificationService.achievementProgress()" [showLabel]="false" color="indigo" />
      </div>

      <!-- Achievements by category -->
      @for (category of achievementCategories; track category) {
        <div class="card p-5">
          <h2 class="text-base font-semibold text-gray-900 mb-4">{{ getCategoryLabel(category) }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            @for (achievement of getAchievementsByCategory(category); track achievement.id) {
              <div
                class="flex items-start gap-3 p-3 rounded-lg border transition-all"
                [class]="achievement.isUnlocked ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50 opacity-60'">
                <span class="text-2xl" [class.grayscale]="!achievement.isUnlocked">{{ achievement.icon }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900">{{ achievement.title }}</p>
                  <p class="text-xs text-gray-500">{{ achievement.description }}</p>
                  @if (!achievement.isUnlocked) {
                    <div class="mt-2">
                      <app-progress-bar
                        [value]="(achievement.progress / achievement.maxProgress) * 100"
                        [showLabel]="false"
                        size="sm"
                        color="indigo" />
                      <p class="text-xs text-gray-400 mt-1">{{ achievement.progress }}/{{ achievement.maxProgress }}</p>
                    </div>
                  } @else {
                    <p class="text-xs text-amber-600 font-medium mt-1">+{{ achievement.xpReward }} XP</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class AchievementsPageComponent implements OnInit {
  gamificationService = inject(GamificationService);

  achievementCategories = Object.values(AchievementCategory);

  ngOnInit(): void {
    this.gamificationService.loadData();
  }

  getCategoryLabel(category: AchievementCategory): string {
    return ACHIEVEMENT_CATEGORY_LABELS[category] ?? category;
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.gamificationService.achievements().filter(a => a.category === category);
  }
}
