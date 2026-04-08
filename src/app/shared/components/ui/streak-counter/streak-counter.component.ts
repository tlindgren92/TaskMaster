import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-streak-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold"
         [class]="containerClass()">
      <span [class]="fireClass()">{{ fireIcon() }}</span>
      <span>{{ streak() }}</span>
      @if (showLabel()) {
        <span class="text-xs font-normal opacity-75">dias</span>
      }
    </div>
  `,
  styles: [`
    @keyframes fireGlow {
      0%, 100% { filter: drop-shadow(0 0 2px #f97316); transform: scale(1); }
      50% { filter: drop-shadow(0 0 8px #ef4444); transform: scale(1.1); }
    }
    .fire-animate {
      animation: fireGlow 1.5s ease-in-out infinite;
    }
  `],
})
export class StreakCounterComponent {
  streak = input(0);
  showLabel = input(true);

  fireIcon = computed(() => {
    const s = this.streak();
    if (s >= 100) return '👑';
    if (s >= 30) return '💎';
    if (s >= 7) return '🔥';
    if (s > 0) return '✨';
    return '💤';
  });

  fireClass = computed(() => {
    return this.streak() >= 7 ? 'fire-animate' : '';
  });

  containerClass = computed(() => {
    const s = this.streak();
    if (s >= 100) return 'bg-amber-100 text-amber-800';
    if (s >= 30) return 'bg-purple-100 text-purple-800';
    if (s >= 7) return 'bg-orange-100 text-orange-800';
    if (s > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-500';
  });
}
