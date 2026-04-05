import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IGamificationRepository } from '../interfaces/gamification-repository.interface';
import {
  Achievement,
  AchievementCategory,
  Challenge,
  Reward,
  RewardRedemption,
  UserLevel,
  LEVEL_TITLES,
} from '../../models/gamification.model';

@Injectable({ providedIn: 'root' })
export class GamificationLocalRepository implements IGamificationRepository {
  private readonly LEVEL_KEY = 'user_level';
  private readonly ACHIEVEMENTS_KEY = 'achievements';
  private readonly CHALLENGES_KEY = 'challenges';
  private readonly REWARDS_KEY = 'rewards';
  private readonly REDEMPTIONS_KEY = 'reward_redemptions';
  private readonly POINTS_KEY = 'available_points';
  private readonly DELAY_MS = 100;

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    if (!localStorage.getItem(this.LEVEL_KEY)) {
      const defaultLevel: UserLevel = {
        level: 1,
        title: LEVEL_TITLES[1],
        currentXP: 0,
        xpForNextLevel: 100,
        totalXP: 0,
      };
      localStorage.setItem(this.LEVEL_KEY, JSON.stringify(defaultLevel));
    }
    if (!localStorage.getItem(this.ACHIEVEMENTS_KEY)) {
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(this.getDefaultAchievements()));
    }
    if (!localStorage.getItem(this.POINTS_KEY)) {
      localStorage.setItem(this.POINTS_KEY, '0');
    }
  }

  private getDefaultAchievements(): Achievement[] {
    return [
      { id: 'first_habit', title: 'Primer paso', description: 'Crea tu primer habito', icon: '🌱', category: AchievementCategory.EXPLORER, requirement: { type: 'habits_created', value: 1 }, xpReward: 50, isUnlocked: false, progress: 0, maxProgress: 1 },
      { id: 'streak_7', title: 'Semana de fuego', description: 'Mantiene una racha de 7 dias', icon: '🔥', category: AchievementCategory.STREAK, requirement: { type: 'streak_days', value: 7 }, xpReward: 100, isUnlocked: false, progress: 0, maxProgress: 7 },
      { id: 'streak_30', title: 'Mes imparable', description: 'Mantiene una racha de 30 dias', icon: '💎', category: AchievementCategory.STREAK, requirement: { type: 'streak_days', value: 30 }, xpReward: 300, isUnlocked: false, progress: 0, maxProgress: 30 },
      { id: 'streak_100', title: 'Centenario', description: 'Mantiene una racha de 100 dias', icon: '👑', category: AchievementCategory.STREAK, requirement: { type: 'streak_days', value: 100 }, xpReward: 1000, isUnlocked: false, progress: 0, maxProgress: 100 },
      { id: 'streak_365', title: 'Leyenda del ano', description: 'Mantiene una racha de 365 dias', icon: '🏆', category: AchievementCategory.STREAK, requirement: { type: 'streak_days', value: 365 }, xpReward: 5000, isUnlocked: false, progress: 0, maxProgress: 365 },
      { id: 'completions_100', title: 'Centenar de logros', description: 'Completa 100 habitos en total', icon: '💯', category: AchievementCategory.MILESTONE, requirement: { type: 'total_completions', value: 100 }, xpReward: 200, isUnlocked: false, progress: 0, maxProgress: 100 },
      { id: 'completions_500', title: 'Medio millar', description: 'Completa 500 habitos en total', icon: '🌟', category: AchievementCategory.MILESTONE, requirement: { type: 'total_completions', value: 500 }, xpReward: 500, isUnlocked: false, progress: 0, maxProgress: 500 },
      { id: 'completions_1000', title: 'Mil y una noches', description: 'Completa 1000 habitos en total', icon: '✨', category: AchievementCategory.MILESTONE, requirement: { type: 'total_completions', value: 1000 }, xpReward: 1000, isUnlocked: false, progress: 0, maxProgress: 1000 },
      { id: 'categories_3', title: 'Explorador', description: 'Crea habitos en 3 categorias diferentes', icon: '🗺️', category: AchievementCategory.VARIETY, requirement: { type: 'categories_used', value: 3 }, xpReward: 100, isUnlocked: false, progress: 0, maxProgress: 3 },
      { id: 'categories_5', title: 'Renacentista', description: 'Crea habitos en 5 categorias diferentes', icon: '🎨', category: AchievementCategory.VARIETY, requirement: { type: 'categories_used', value: 5 }, xpReward: 200, isUnlocked: false, progress: 0, maxProgress: 5 },
      { id: 'perfect_week', title: 'Semana perfecta', description: 'Completa todos tus habitos durante una semana', icon: '⭐', category: AchievementCategory.CONSISTENCY, requirement: { type: 'perfect_week', value: 1 }, xpReward: 150, isUnlocked: false, progress: 0, maxProgress: 1 },
      { id: 'perfect_month', title: 'Mes perfecto', description: 'Completa todos tus habitos durante un mes', icon: '🏅', category: AchievementCategory.CONSISTENCY, requirement: { type: 'perfect_month', value: 1 }, xpReward: 500, isUnlocked: false, progress: 0, maxProgress: 1 },
      { id: 'level_5', title: 'En camino', description: 'Alcanza el nivel 5', icon: '🎯', category: AchievementCategory.LEVEL, requirement: { type: 'level_reached', value: 5 }, xpReward: 200, isUnlocked: false, progress: 0, maxProgress: 5 },
      { id: 'level_10', title: 'Leyenda', description: 'Alcanza el nivel 10', icon: '🔱', category: AchievementCategory.LEVEL, requirement: { type: 'level_reached', value: 10 }, xpReward: 500, isUnlocked: false, progress: 0, maxProgress: 10 },
      { id: 'habits_5', title: 'Cinco pilares', description: 'Crea 5 habitos', icon: '🏛️', category: AchievementCategory.EXPLORER, requirement: { type: 'habits_created', value: 5 }, xpReward: 100, isUnlocked: false, progress: 0, maxProgress: 5 },
      { id: 'habits_10', title: 'Decena dorada', description: 'Crea 10 habitos', icon: '🌈', category: AchievementCategory.EXPLORER, requirement: { type: 'habits_created', value: 10 }, xpReward: 200, isUnlocked: false, progress: 0, maxProgress: 10 },
    ];
  }

  getUserLevel(): Observable<UserLevel> {
    const stored = localStorage.getItem(this.LEVEL_KEY);
    const level: UserLevel = stored ? JSON.parse(stored) : { level: 1, title: 'Novato', currentXP: 0, xpForNextLevel: 100, totalXP: 0 };
    return of(level).pipe(delay(this.DELAY_MS));
  }

  saveUserLevel(level: UserLevel): Observable<UserLevel> {
    localStorage.setItem(this.LEVEL_KEY, JSON.stringify(level));
    return of(level).pipe(delay(this.DELAY_MS));
  }

  getAchievements(): Observable<Achievement[]> {
    const stored = localStorage.getItem(this.ACHIEVEMENTS_KEY);
    const achievements: Achievement[] = stored ? JSON.parse(stored) : [];
    return of(achievements).pipe(delay(this.DELAY_MS));
  }

  unlockAchievement(achievementId: string): Observable<Achievement> {
    const stored = localStorage.getItem(this.ACHIEVEMENTS_KEY);
    const achievements: Achievement[] = stored ? JSON.parse(stored) : [];
    const index = achievements.findIndex(a => a.id === achievementId);
    if (index !== -1) {
      achievements[index] = {
        ...achievements[index],
        isUnlocked: true,
        unlockedAt: new Date(),
        progress: achievements[index].maxProgress,
      };
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      return of(achievements[index]).pipe(delay(this.DELAY_MS));
    }
    return of(achievements[0]).pipe(delay(this.DELAY_MS));
  }

  updateAchievementProgress(achievementId: string, progress: number): Observable<Achievement> {
    const stored = localStorage.getItem(this.ACHIEVEMENTS_KEY);
    const achievements: Achievement[] = stored ? JSON.parse(stored) : [];
    const index = achievements.findIndex(a => a.id === achievementId);
    if (index !== -1) {
      achievements[index] = { ...achievements[index], progress: Math.min(progress, achievements[index].maxProgress) };
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(achievements));
      return of(achievements[index]).pipe(delay(this.DELAY_MS));
    }
    return of(achievements[0]).pipe(delay(this.DELAY_MS));
  }

  getChallenges(): Observable<Challenge[]> {
    const stored = localStorage.getItem(this.CHALLENGES_KEY);
    const challenges: Challenge[] = stored ? JSON.parse(stored) : [];
    return of(challenges).pipe(delay(this.DELAY_MS));
  }

  updateChallengeProgress(challengeId: string, progress: number): Observable<Challenge> {
    const stored = localStorage.getItem(this.CHALLENGES_KEY);
    const challenges: Challenge[] = stored ? JSON.parse(stored) : [];
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index !== -1) {
      challenges[index] = { ...challenges[index], progress };
      localStorage.setItem(this.CHALLENGES_KEY, JSON.stringify(challenges));
      return of(challenges[index]).pipe(delay(this.DELAY_MS));
    }
    return of(challenges[0]).pipe(delay(this.DELAY_MS));
  }

  getRewards(): Observable<Reward[]> {
    const stored = localStorage.getItem(this.REWARDS_KEY);
    const rewards: Reward[] = stored ? JSON.parse(stored) : [];
    return of(rewards).pipe(delay(this.DELAY_MS));
  }

  getRedemptions(): Observable<RewardRedemption[]> {
    const stored = localStorage.getItem(this.REDEMPTIONS_KEY);
    const redemptions: RewardRedemption[] = stored ? JSON.parse(stored) : [];
    return of(redemptions).pipe(delay(this.DELAY_MS));
  }

  createRedemption(rewardId: string, pointsSpent: number): Observable<RewardRedemption> {
    const stored = localStorage.getItem(this.REDEMPTIONS_KEY);
    const redemptions: RewardRedemption[] = stored ? JSON.parse(stored) : [];
    const redemption: RewardRedemption = {
      id: this.generateId(),
      userId: 'local-user',
      rewardId,
      redeemedAt: new Date(),
      pointsSpent,
      status: 'pending',
    };
    redemptions.push(redemption);
    localStorage.setItem(this.REDEMPTIONS_KEY, JSON.stringify(redemptions));
    return of(redemption).pipe(delay(this.DELAY_MS));
  }

  getAvailablePoints(): Observable<number> {
    const points = parseInt(localStorage.getItem(this.POINTS_KEY) ?? '0', 10);
    return of(points).pipe(delay(this.DELAY_MS));
  }

  updatePoints(points: number): Observable<number> {
    localStorage.setItem(this.POINTS_KEY, String(points));
    return of(points).pipe(delay(this.DELAY_MS));
  }
}
