import {
  xpRequiredForLevel,
  calculateLevel,
  calculateHabitCompletionXP,
  getStreakBonusXP,
  isStreakMilestone,
  getLevelProgress,
} from './xp.utils';
import { XP_CONFIG } from '../../models/gamification.model';

describe('xp.utils', () => {
  describe('xpRequiredForLevel', () => {
    it('returns base XP for level 1', () => {
      expect(xpRequiredForLevel(1)).toBe(XP_CONFIG.LEVEL_BASE_XP);
    });

    it('grows with level', () => {
      expect(xpRequiredForLevel(2)).toBeGreaterThan(xpRequiredForLevel(1));
      expect(xpRequiredForLevel(5)).toBeGreaterThan(xpRequiredForLevel(2));
    });
  });

  describe('calculateLevel', () => {
    it('starts at level 1 with no XP', () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.currentXP).toBe(0);
      expect(result.totalXP).toBe(0);
    });

    it('levels up when crossing threshold', () => {
      const req = xpRequiredForLevel(1);
      const result = calculateLevel(req);
      expect(result.level).toBe(2);
      expect(result.currentXP).toBe(0);
    });

    it('keeps remainder XP as currentXP', () => {
      const req = xpRequiredForLevel(1);
      const result = calculateLevel(req + 10);
      expect(result.level).toBe(2);
      expect(result.currentXP).toBe(10);
    });
  });

  describe('calculateHabitCompletionXP', () => {
    it('returns base XP with no streak', () => {
      expect(calculateHabitCompletionXP(10, 0)).toBe(10);
      expect(calculateHabitCompletionXP(10, 6)).toBe(10);
    });

    it('multiplies by streak bonus every 7 days', () => {
      const withWeek = calculateHabitCompletionXP(10, 7);
      expect(withWeek).toBeGreaterThan(10);
      const withTwoWeeks = calculateHabitCompletionXP(10, 14);
      expect(withTwoWeeks).toBeGreaterThan(withWeek);
    });
  });

  describe('getStreakBonusXP', () => {
    it('returns 0 below first milestone', () => {
      expect(getStreakBonusXP(6)).toBe(0);
    });

    it('awards tiered bonuses', () => {
      expect(getStreakBonusXP(7)).toBe(XP_CONFIG.STREAK_7_BONUS);
      expect(getStreakBonusXP(30)).toBe(XP_CONFIG.STREAK_30_BONUS);
      expect(getStreakBonusXP(100)).toBe(XP_CONFIG.STREAK_100_BONUS);
    });
  });

  describe('isStreakMilestone', () => {
    it('flags known milestones', () => {
      expect(isStreakMilestone(7)).toBeTrue();
      expect(isStreakMilestone(30)).toBeTrue();
      expect(isStreakMilestone(100)).toBeTrue();
      expect(isStreakMilestone(365)).toBeTrue();
    });

    it('ignores non-milestones', () => {
      expect(isStreakMilestone(6)).toBeFalse();
      expect(isStreakMilestone(50)).toBeFalse();
    });
  });

  describe('getLevelProgress', () => {
    it('returns percentage current/next', () => {
      const progress = getLevelProgress({
        level: 2,
        title: 'x',
        currentXP: 50,
        xpForNextLevel: 200,
        totalXP: 150,
      });
      expect(progress).toBe(25);
    });

    it('returns 100 when xpForNextLevel is 0', () => {
      const progress = getLevelProgress({
        level: 99,
        title: 'x',
        currentXP: 0,
        xpForNextLevel: 0,
        totalXP: 10000,
      });
      expect(progress).toBe(100);
    });
  });
});
