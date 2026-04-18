import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Achievement, Challenge, Reward, RewardRedemption } from '../../models/gamification.model';
import { UserLevel } from '../../models/gamification.model';

export interface IGamificationRepository {
  getUserLevel(): Observable<UserLevel>;
  saveUserLevel(level: UserLevel): Observable<UserLevel>;

  getAchievements(): Observable<Achievement[]>;
  unlockAchievement(achievementId: string): Observable<Achievement>;
  updateAchievementProgress(achievementId: string, progress: number): Observable<Achievement>;

  getChallenges(): Observable<Challenge[]>;
  saveChallenges(challenges: Challenge[]): Observable<Challenge[]>;
  updateChallengeProgress(challengeId: string, progress: number): Observable<Challenge>;

  getRewards(): Observable<Reward[]>;
  getRedemptions(): Observable<RewardRedemption[]>;
  createRedemption(rewardId: string, pointsSpent: number): Observable<RewardRedemption>;

  getAvailablePoints(): Observable<number>;
  updatePoints(points: number): Observable<number>;
}

export const GAMIFICATION_REPOSITORY_TOKEN = new InjectionToken<IGamificationRepository>(
  'GamificationRepository'
);
