import { Injectable, inject, signal, computed } from '@angular/core';
import { UserProfile, UserSettings, DEFAULT_USER_SETTINGS } from '../../models/user.model';
import { USER_REPOSITORY_TOKEN } from '../interfaces/user-repository.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private userRepo = inject(USER_REPOSITORY_TOKEN);

  private _profile = signal<UserProfile | null>(null);
  private _settings = signal<UserSettings>(DEFAULT_USER_SETTINGS);
  private _loading = signal(false);

  readonly profile = this._profile.asReadonly();
  readonly settings = this._settings.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly displayName = computed(() => this._profile()?.displayName ?? 'Usuario');
  readonly isAuthenticated = computed(() => this._profile() !== null);

  loadUser(): void {
    this._loading.set(true);
    this.userRepo.getProfile().subscribe({
      next: profile => {
        this._profile.set(profile);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
    this.userRepo.getSettings().subscribe({
      next: settings => this._settings.set(settings),
    });
  }

  updateProfile(partial: Partial<UserProfile>): void {
    this.userRepo.updateProfile(partial).subscribe({
      next: updated => this._profile.set(updated),
    });
  }

  updateSettings(partial: Partial<UserSettings>): void {
    this.userRepo.updateSettings(partial).subscribe({
      next: updated => this._settings.set(updated),
    });
  }

  updateGoals(goals: string[]): void {
    this.updateProfile({ goals });
  }
}
