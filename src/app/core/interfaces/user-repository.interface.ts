import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfile, UserSettings } from '../../models/user.model';

export interface IUserRepository {
  getProfile(): Observable<UserProfile>;
  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile>;
  getSettings(): Observable<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Observable<UserSettings>;
}

export const USER_REPOSITORY_TOKEN = new InjectionToken<IUserRepository>('UserRepository');
