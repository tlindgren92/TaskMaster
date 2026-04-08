import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { UserProfile, UserSettings, DEFAULT_USER_SETTINGS } from '../../models/user.model';
import { DayOfWeek } from '../../models/habit.model';

@Injectable({ providedIn: 'root' })
export class UserLocalRepository implements IUserRepository {
  private readonly PROFILE_KEY = 'user_profile';
  private readonly SETTINGS_KEY = 'user_settings';
  private readonly DELAY_MS = 100;

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    if (!localStorage.getItem(this.PROFILE_KEY)) {
      const defaultProfile: UserProfile = {
        id: 'local-user',
        email: '',
        displayName: 'Usuario',
        totalXP: 0,
        currentLevel: 1,
        availablePoints: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'es',
        goals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorage.setItem(this.PROFILE_KEY, JSON.stringify(defaultProfile));
    }
    if (!localStorage.getItem(this.SETTINGS_KEY)) {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(DEFAULT_USER_SETTINGS));
    }
  }

  getProfile(): Observable<UserProfile> {
    const stored = localStorage.getItem(this.PROFILE_KEY);
    const profile: UserProfile = stored
      ? { ...JSON.parse(stored), createdAt: new Date(JSON.parse(stored).createdAt), updatedAt: new Date(JSON.parse(stored).updatedAt) }
      : { id: 'local-user', email: '', displayName: 'Usuario', totalXP: 0, currentLevel: 1, availablePoints: 0, timezone: 'UTC', language: 'es', goals: [], createdAt: new Date(), updatedAt: new Date() };
    return of(profile).pipe(delay(this.DELAY_MS));
  }

  updateProfile(partial: Partial<UserProfile>): Observable<UserProfile> {
    const stored = localStorage.getItem(this.PROFILE_KEY);
    const current: UserProfile = stored ? JSON.parse(stored) : {};
    const updated: UserProfile = { ...current, ...partial, updatedAt: new Date() };
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(updated));
    return of(updated).pipe(delay(this.DELAY_MS));
  }

  getSettings(): Observable<UserSettings> {
    const stored = localStorage.getItem(this.SETTINGS_KEY);
    const settings: UserSettings = stored ? JSON.parse(stored) : DEFAULT_USER_SETTINGS;
    return of(settings).pipe(delay(this.DELAY_MS));
  }

  updateSettings(partial: Partial<UserSettings>): Observable<UserSettings> {
    const stored = localStorage.getItem(this.SETTINGS_KEY);
    const current: UserSettings = stored ? JSON.parse(stored) : DEFAULT_USER_SETTINGS;
    const updated: UserSettings = { ...current, ...partial };
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated));
    return of(updated).pipe(delay(this.DELAY_MS));
  }
}
