import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'xp' | 'achievement';
  title: string;
  message?: string;
  icon?: string;
  duration?: number;
  xpAmount?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = signal<AppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  readonly hasNotifications = computed(() => this._notifications().length > 0);

  show(notification: Omit<AppNotification, 'id'>): void {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const duration = notification.duration ?? 3000;
    const newNotification: AppNotification = { ...notification, id };

    this._notifications.update(list => [...list, newNotification]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  success(title: string, message?: string): void {
    this.show({ type: 'success', title, message, icon: '✅' });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'error', title, message, icon: '❌', duration: 5000 });
  }

  warning(title: string, message?: string): void {
    this.show({ type: 'warning', title, message, icon: '⚠️' });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'info', title, message, icon: 'ℹ️' });
  }

  xpGained(amount: number, source?: string): void {
    this.show({
      type: 'xp',
      title: `+${amount} XP`,
      message: source,
      icon: '⚡',
      xpAmount: amount,
      duration: 2000,
    });
  }

  achievementUnlocked(title: string, icon: string): void {
    this.show({
      type: 'achievement',
      title: 'Logro desbloqueado!',
      message: title,
      icon,
      duration: 5000,
    });
  }
}
