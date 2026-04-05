import { Injectable, inject, signal, computed } from '@angular/core';
import {
  UserLevel,
  Achievement,
  Challenge,
  XP_CONFIG,
} from '../../models/gamification.model';
import { GAMIFICATION_REPOSITORY_TOKEN } from '../interfaces/gamification-repository.interface';
import { calculateLevel } from '../utils/xp.utils';
import { NotificationService } from './notification.service';

export interface AchievementCheckContext {
  maxStreak: number;
  totalCompletions: number;
  habitsCreated: number;
  categoriesUsed: number;
  currentLevel: number;
  perfectWeeks: number;
  perfectMonths: number;
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private gamificationRepo = inject(GAMIFICATION_REPOSITORY_TOKEN);
  private notificationService = inject(NotificationService);

  private _userLevel = signal<UserLevel>({
    level: 1,
    title: 'Novato',
    currentXP: 0,
    xpForNextLevel: 100,
    totalXP: 0,
  });
  private _achievements = signal<Achievement[]>([]);
  private _challenges = signal<Challenge[]>([]);
  private _availablePoints = signal(0);

  readonly userLevel = this._userLevel.asReadonly();
  readonly achievements = this._achievements.asReadonly();
  readonly challenges = this._challenges.asReadonly();
  readonly availablePoints = this._availablePoints.asReadonly();

  readonly unlockedAchievements = computed(() =>
    this._achievements().filter(a => a.isUnlocked)
  );

  readonly lockedAchievements = computed(() =>
    this._achievements().filter(a => !a.isUnlocked)
  );

  readonly activeChallenges = computed(() =>
    this._challenges().filter(c => c.isActive && !c.isCompleted)
  );

  readonly achievementProgress = computed(() => {
    const all = this._achievements();
    if (all.length === 0) return 0;
    return Math.round((this.unlockedAchievements().length / all.length) * 100);
  });

  loadData(): void {
    this.gamificationRepo.getUserLevel().subscribe({
      next: level => this._userLevel.set(level),
    });
    this.gamificationRepo.getAchievements().subscribe({
      next: achievements => this._achievements.set(achievements),
    });
    this.gamificationRepo.getChallenges().subscribe({
      next: challenges => this._challenges.set(challenges),
    });
    this.gamificationRepo.getAvailablePoints().subscribe({
      next: points => this._availablePoints.set(points),
    });
  }

  awardXP(amount: number, source: string): void {
    const currentLevel = this._userLevel();
    const newTotalXP = currentLevel.totalXP + amount;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel.level > currentLevel.level;

    this._userLevel.set(newLevel);
    this.gamificationRepo.saveUserLevel(newLevel).subscribe();

    this.notificationService.xpGained(amount, source);

    if (leveledUp) {
      const pointsEarned = XP_CONFIG.POINTS_PER_LEVEL_UP * newLevel.level;
      this._availablePoints.update(p => p + pointsEarned);
      this.gamificationRepo.updatePoints(this._availablePoints()).subscribe();
      this.notificationService.success(
        `Nivel ${newLevel.level}: ${newLevel.title}!`,
        `Has ganado ${pointsEarned} puntos canjeables`
      );
    }
  }

  checkAchievements(context: AchievementCheckContext): void {
    const achievements = this._achievements();
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.isUnlocked) continue;

      let currentProgress = 0;

      switch (achievement.requirement.type) {
        case 'streak_days':
          currentProgress = context.maxStreak;
          break;
        case 'total_completions':
          currentProgress = context.totalCompletions;
          break;
        case 'habits_created':
          currentProgress = context.habitsCreated;
          break;
        case 'level_reached':
          currentProgress = context.currentLevel;
          break;
        case 'categories_used':
          currentProgress = context.categoriesUsed;
          break;
        case 'perfect_week':
          currentProgress = context.perfectWeeks;
          break;
        case 'perfect_month':
          currentProgress = context.perfectMonths;
          break;
      }

      // Update progress
      if (currentProgress !== achievement.progress) {
        this.gamificationRepo.updateAchievementProgress(achievement.id, currentProgress).subscribe();
      }

      // Check if newly unlocked
      if (currentProgress >= achievement.requirement.value) {
        newlyUnlocked.push(achievement);
        this.gamificationRepo.unlockAchievement(achievement.id).subscribe();
      }
    }

    if (newlyUnlocked.length > 0) {
      // Update local state
      this._achievements.update(list =>
        list.map(a => {
          const unlocked = newlyUnlocked.find(u => u.id === a.id);
          if (unlocked) {
            return { ...a, isUnlocked: true, unlockedAt: new Date(), progress: a.maxProgress };
          }
          const currentAch = achievements.find(ca => ca.id === a.id);
          if (currentAch) {
            return { ...a, progress: currentAch.progress };
          }
          return a;
        })
      );

      // Award XP for each unlocked achievement
      for (const achievement of newlyUnlocked) {
        this.awardXP(achievement.xpReward, `Logro: ${achievement.title}`);
        this.notificationService.achievementUnlocked(achievement.title, achievement.icon);
      }
    }
  }

  spendPoints(amount: number): boolean {
    if (this._availablePoints() < amount) return false;
    this._availablePoints.update(p => p - amount);
    this.gamificationRepo.updatePoints(this._availablePoints()).subscribe();
    return true;
  }
}
