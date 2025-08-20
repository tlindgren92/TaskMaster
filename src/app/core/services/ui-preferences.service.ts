import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface UiPreferencesState {
  completedCollapsed: boolean;
  showStatsCompact: boolean;
}

const STORAGE_KEY = 'ui-preferences';

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  private stateSubject: BehaviorSubject<UiPreferencesState>;

  public readonly state$;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial: UiPreferencesState = stored
      ? JSON.parse(stored)
      : { completedCollapsed: false, showStatsCompact: true };

    this.stateSubject = new BehaviorSubject<UiPreferencesState>(initial);
    this.state$ = this.stateSubject.asObservable();
  }

  get value(): UiPreferencesState {
    return this.stateSubject.value;
  }

  setCompletedCollapsed(collapsed: boolean): void {
    this.patch({ completedCollapsed: collapsed });
  }

  toggleCompletedCollapsed(): void {
    this.patch({ completedCollapsed: !this.value.completedCollapsed });
  }

  setShowStatsCompact(show: boolean): void {
    this.patch({ showStatsCompact: show });
  }

  private patch(partial: Partial<UiPreferencesState>): void {
    const next = { ...this.value, ...partial };
    this.stateSubject.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}
