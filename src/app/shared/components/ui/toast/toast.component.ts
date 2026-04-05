import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NotificationService, AppNotification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (notification of notificationService.notifications(); track notification.id) {
        <div
          class="pointer-events-auto animate-slide-up rounded-lg shadow-lg border p-4 flex items-start gap-3"
          [class]="getNotificationClasses(notification)">
          @if (notification.icon) {
            <span class="text-xl flex-shrink-0">{{ notification.icon }}</span>
          }
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold" [class]="getTitleClass(notification)">
              {{ notification.title }}
            </p>
            @if (notification.message) {
              <p class="text-xs mt-0.5 opacity-80">{{ notification.message }}</p>
            }
          </div>
          <button
            (click)="notificationService.dismiss(notification.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  notificationService = inject(NotificationService);

  getNotificationClasses(n: AppNotification): string {
    switch (n.type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'xp': return 'bg-indigo-50 border-indigo-200';
      case 'achievement': return 'bg-amber-50 border-amber-200';
      default: return 'bg-white border-gray-200';
    }
  }

  getTitleClass(n: AppNotification): string {
    switch (n.type) {
      case 'success': return 'text-green-800';
      case 'error': return 'text-red-800';
      case 'warning': return 'text-yellow-800';
      case 'info': return 'text-blue-800';
      case 'xp': return 'text-indigo-800';
      case 'achievement': return 'text-amber-800';
      default: return 'text-gray-800';
    }
  }
}
