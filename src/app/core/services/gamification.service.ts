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
import { XpEvent } from '../../shared/components/ui/xp-popup/xp-popup.component';

export interface AchievementCheckContext {
  maxStreak: number;
  totalCompletions: number;
  habitsCreated: number;
  categoriesUsed: number;
  currentLevel: number;
  perfectWeeks: number;
  perfectMonths: number;
}

export interface LevelUpEvent {
  newLevel: number;
  title: string;
  totalXP: number;
  pointsEarned: number;
}

export interface AchievementEvent {
  id: string;
  title: string;
  icon: string;
  xpReward: number;
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

  // Visual feedback signals
  private _xpEvents = signal<XpEvent[]>([]);
  private _levelUpEvent = signal<LevelUpEvent | null>(null);
  private _achievementEvents = signal<AchievementEvent[]>([]);

  readonly userLevel = this._userLevel.asReadonly();
  readonly achievements = this._achievements.asReadonly();
  readonly challenges = this._challenges.asReadonly();
  readonly availablePoints = this._availablePoints.asReadonly();
  readonly xpEvents = this._xpEvents.asReadonly();
  readonly levelUpEvent = this._levelUpEvent.asReadonly();
  readonly achievementEvents = this._achievementEvents.asReadonly();

  readonly unlockedAchievements = computed(() =>
    this._achievements().filter(a => a.isUnlocked)
  );

  readonly lockedAchievements = computed(() =>
    this._achievements().filter(a => !a.isUnlocked)
  );

  readonly activeChallenges = computed(() =>
    this._challenges().filter(c => c.isActive && !c.isCompleted)
  );

  readonly completedChallenges = computed(() =>
    this._challenges().filter(c => c.isCompleted)
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
      next: challenges => {
        this._challenges.set(challenges);
        this.ensureWeeklyChallenges();
      },
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

    // Show XP popup at a random position near top-center
    this.showXpPopup(amount);

    if (leveledUp) {
      const pointsEarned = XP_CONFIG.POINTS_PER_LEVEL_UP * newLevel.level;
      this._availablePoints.update(p => p + pointsEarned);
      this.gamificationRepo.updatePoints(this._availablePoints()).subscribe();

      // Show level-up modal
      this._levelUpEvent.set({
        newLevel: newLevel.level,
        title: newLevel.title,
        totalXP: newLevel.totalXP,
        pointsEarned,
      });
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

      // Award XP and show achievement toast for each unlocked
      for (const achievement of newlyUnlocked) {
        this.awardXP(achievement.xpReward, `Logro: ${achievement.title}`);
        this.showAchievementToast(achievement);
      }
    }
  }

  // Challenge management
  checkChallengeProgress(completionsToday: number, totalCompletions: number, maxStreak: number): void {
    const challenges = this._challenges();
    let updated = false;

    for (const challenge of challenges) {
      if (!challenge.isActive || challenge.isCompleted) continue;

      // Check if expired
      if (new Date(challenge.endDate) < new Date()) {
        continue;
      }

      let progress = 0;
      switch (challenge.requirement.type) {
        case 'complete_n_habits':
          progress = totalCompletions;
          break;
        case 'maintain_streak':
          progress = maxStreak;
          break;
        case 'no_missed_days':
          progress = completionsToday > 0 ? challenge.progress + 1 : 0;
          break;
      }

      if (progress !== challenge.progress) {
        const isNowCompleted = progress >= challenge.requirement.value;
        this.gamificationRepo.updateChallengeProgress(challenge.id, progress).subscribe();

        if (isNowCompleted && !challenge.isCompleted) {
          this.awardXP(challenge.xpReward, `Desafio: ${challenge.title}`);
          if (challenge.pointsReward > 0) {
            this._availablePoints.update(p => p + challenge.pointsReward);
            this.gamificationRepo.updatePoints(this._availablePoints()).subscribe();
          }
          this.notificationService.success(
            'Desafio completado!',
            `${challenge.title} - +${challenge.xpReward} XP`
          );
        }

        updated = true;
      }
    }

    if (updated) {
      this.gamificationRepo.getChallenges().subscribe({
        next: challenges => this._challenges.set(challenges),
      });
    }
  }

  spendPoints(amount: number): boolean {
    if (this._availablePoints() < amount) return false;
    this._availablePoints.update(p => p - amount);
    this.gamificationRepo.updatePoints(this._availablePoints()).subscribe();
    return true;
  }

  dismissLevelUp(): void {
    this._levelUpEvent.set(null);
  }

  // Private helpers

  private showXpPopup(amount: number): void {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const x = window.innerWidth / 2 - 40 + (Math.random() - 0.5) * 60;
    const y = window.innerHeight / 3 + (Math.random() - 0.5) * 40;

    const event: XpEvent = { id, amount, source: '', x, y };
    this._xpEvents.update(list => [...list, event]);

    setTimeout(() => {
      this._xpEvents.update(list => list.filter(e => e.id !== id));
    }, 1500);
  }

  private showAchievementToast(achievement: Achievement): void {
    const event: AchievementEvent = {
      id: achievement.id + '_' + Date.now(),
      title: achievement.title,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
    };
    this._achievementEvents.update(list => [...list, event]);

    setTimeout(() => {
      this._achievementEvents.update(list => list.filter(e => e.id !== event.id));
    }, 4000);
  }

  private ensureWeeklyChallenges(): void {
    const challenges = this._challenges();
    const now = new Date();

    // Check if we have an active challenge for this week
    const hasActiveWeekly = challenges.some(c =>
      c.type === 'weekly' && c.isActive && new Date(c.endDate) > now
    );

    if (!hasActiveWeekly) {
      this.generateWeeklyChallenges();
    }
  }

  private generateWeeklyChallenges(): void {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const templates: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'progress' | 'isCompleted' | 'isActive'>[] = [
      {
        title: 'Racha semanal',
        description: 'Completa al menos un habito cada dia esta semana',
        type: 'weekly',
        requirement: { type: 'no_missed_days', value: 7 },
        xpReward: 100,
        pointsReward: 25,
      },
      {
        title: 'Maratonista',
        description: 'Completa 20 habitos esta semana',
        type: 'weekly',
        requirement: { type: 'complete_n_habits', value: 20 },
        xpReward: 75,
        pointsReward: 15,
      },
      {
        title: 'Constancia de fuego',
        description: 'Mantiene una racha de 5 dias o mas',
        type: 'weekly',
        requirement: { type: 'maintain_streak', value: 5 },
        xpReward: 80,
        pointsReward: 20,
      },
    ];

    // Pick 2 random challenges
    const shuffled = templates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);

    const newChallenges: Challenge[] = selected.map((template, i) => ({
      ...template,
      id: `weekly_${now.getTime()}_${i}`,
      startDate: now,
      endDate: endOfWeek,
      progress: 0,
      isCompleted: false,
      isActive: true,
    }));

    const existing = this._challenges();
    const updated = [...existing.filter(c => c.isActive && !c.isCompleted), ...newChallenges];
    this._challenges.set(updated);

    this.gamificationRepo.saveChallenges(updated).subscribe();
  }
}
