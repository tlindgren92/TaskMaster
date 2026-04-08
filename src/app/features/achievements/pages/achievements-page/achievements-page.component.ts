import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GamificationService } from '../../../../core/services/gamification.service';
import { XpBarComponent } from '../../../../shared/components/ui/xp-bar/xp-bar.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { ChallengeCardComponent } from '../../../../shared/components/ui/challenge-card/challenge-card.component';
import { Achievement, ACHIEVEMENT_CATEGORY_LABELS, AchievementCategory } from '../../../../models/gamification.model';

@Component({
  selector: 'app-achievements-page',
  standalone: true,
  imports: [XpBarComponent, ProgressBarComponent, ChallengeCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Logros & Desafios</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ gamificationService.unlockedAchievements().length }} de {{ gamificationService.achievements().length }} desbloqueados
        </p>
      </div>

      <!-- Level card -->
      <div class="card p-5">
        <app-xp-bar />
      </div>

      <!-- Active challenges -->
      @if (gamificationService.activeChallenges().length > 0) {
        <div>
          <h2 class="text-base font-semibold text-gray-900 mb-3">Desafios activos</h2>
          <div class="space-y-3">
            @for (challenge of gamificationService.activeChallenges(); track challenge.id) {
              <app-challenge-card [challenge]="challenge" />
            }
          </div>
        </div>
      }

      <!-- Completed challenges -->
      @if (gamificationService.completedChallenges().length > 0) {
        <div>
          <h2 class="text-base font-semibold text-gray-900 mb-3">Desafios completados</h2>
          <div class="space-y-3">
            @for (challenge of gamificationService.completedChallenges(); track challenge.id) {
              <app-challenge-card [challenge]="challenge" />
            }
          </div>
        </div>
      }

      <!-- Overall progress -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-base font-semibold text-gray-900">Progreso total de logros</h2>
          <span class="text-sm font-medium text-indigo-600">{{ gamificationService.achievementProgress() }}%</span>
        </div>
        <app-progress-bar [value]="gamificationService.achievementProgress()" [showLabel]="false" color="indigo" />
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          (click)="activeFilter.set('all')"
          class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          [class]="activeFilter() === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          Todos ({{ gamificationService.achievements().length }})
        </button>
        <button
          (click)="activeFilter.set('unlocked')"
          class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          [class]="activeFilter() === 'unlocked' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          Desbloqueados ({{ gamificationService.unlockedAchievements().length }})
        </button>
        <button
          (click)="activeFilter.set('locked')"
          class="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
          [class]="activeFilter() === 'locked' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          Bloqueados ({{ gamificationService.lockedAchievements().length }})
        </button>
      </div>

      <!-- Achievements by category -->
      @for (category of achievementCategories; track category) {
        @if (getFilteredAchievementsByCategory(category).length > 0) {
          <div class="card p-5">
            <div class="flex items-center gap-2 mb-4">
              <span class="text-lg">{{ getCategoryIcon(category) }}</span>
              <h2 class="text-base font-semibold text-gray-900">{{ getCategoryLabel(category) }}</h2>
              <span class="text-xs text-gray-400">
                {{ getUnlockedCountByCategory(category) }}/{{ getAchievementsByCategory(category).length }}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (achievement of getFilteredAchievementsByCategory(category); track achievement.id) {
                <div
                  class="flex items-start gap-3 p-3 rounded-xl border-2 transition-all"
                  [class]="achievement.isUnlocked
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50'">
                  <!-- Icon -->
                  <div
                    class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    [class]="achievement.isUnlocked ? 'bg-amber-100' : 'bg-gray-100'">
                    <span class="text-2xl" [class.grayscale]="!achievement.isUnlocked" [class.opacity-40]="!achievement.isUnlocked">
                      {{ achievement.icon }}
                    </span>
                  </div>
                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold" [class]="achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'">
                      {{ achievement.title }}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ achievement.description }}</p>
                    @if (achievement.isUnlocked) {
                      <div class="flex items-center gap-2 mt-2">
                        <span class="text-xs font-semibold text-amber-600">+{{ achievement.xpReward }} XP</span>
                        @if (achievement.unlockedAt) {
                          <span class="text-xs text-gray-300">{{ formatDate(achievement.unlockedAt) }}</span>
                        }
                      </div>
                    } @else {
                      <div class="mt-2">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              class="h-full bg-indigo-400 rounded-full transition-all duration-500"
                              [style.width.%]="(achievement.progress / achievement.maxProgress) * 100">
                            </div>
                          </div>
                          <span class="text-xs text-gray-400 tabular-nums">{{ achievement.progress }}/{{ achievement.maxProgress }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class AchievementsPageComponent implements OnInit {
  gamificationService = inject(GamificationService);

  achievementCategories = Object.values(AchievementCategory);
  activeFilter = signal<'all' | 'unlocked' | 'locked'>('all');

  ngOnInit(): void {
    this.gamificationService.loadData();
  }

  getCategoryLabel(category: AchievementCategory): string {
    return ACHIEVEMENT_CATEGORY_LABELS[category] ?? category;
  }

  getCategoryIcon(category: AchievementCategory): string {
    const icons: Record<AchievementCategory, string> = {
      [AchievementCategory.STREAK]: '🔥',
      [AchievementCategory.CONSISTENCY]: '📊',
      [AchievementCategory.VARIETY]: '🎨',
      [AchievementCategory.MILESTONE]: '🏆',
      [AchievementCategory.EXPLORER]: '🗺️',
      [AchievementCategory.LEVEL]: '⬆️',
    };
    return icons[category] ?? '🎯';
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.gamificationService.achievements().filter(a => a.category === category);
  }

  getFilteredAchievementsByCategory(category: AchievementCategory): Achievement[] {
    const filter = this.activeFilter();
    return this.getAchievementsByCategory(category).filter(a => {
      if (filter === 'unlocked') return a.isUnlocked;
      if (filter === 'locked') return !a.isUnlocked;
      return true;
    });
  }

  getUnlockedCountByCategory(category: AchievementCategory): number {
    return this.getAchievementsByCategory(category).filter(a => a.isUnlocked).length;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }
}
