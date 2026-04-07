import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { GamificationService } from '../../../../core/services/gamification.service';

export interface XpEvent {
  id: string;
  amount: number;
  source: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-xp-popup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (event of gamificationService.xpEvents(); track event.id) {
      <div
        class="fixed z-[60] pointer-events-none animate-xp-rise select-none"
        [style.left.px]="event.x"
        [style.top.px]="event.y">
        <div class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <svg class="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/>
          </svg>
          <span class="text-sm font-bold">+{{ event.amount }} XP</span>
        </div>
      </div>
    }
  `,
})
export class XpPopupComponent {
  gamificationService = inject(GamificationService);
}
