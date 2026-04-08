import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (showLabel()) {
        <div class="flex justify-between text-xs mb-1">
          <span class="text-gray-600">{{ label() }}</span>
          <span class="font-medium" [class]="textColorClass()">{{ value() }}%</span>
        </div>
      }
      <div class="h-2 rounded-full overflow-hidden" [class]="trackClass()">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          [class]="barColorClass()"
          [style.width.%]="clampedValue()">
        </div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  value = input(0);
  label = input('');
  showLabel = input(true);
  color = input<'auto' | 'indigo' | 'green' | 'amber' | 'red'>('auto');
  size = input<'sm' | 'md' | 'lg'>('md');

  clampedValue = computed(() => Math.max(0, Math.min(100, this.value())));

  trackClass = computed(() => {
    const sizeMap = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
    return `${sizeMap[this.size()]} bg-gray-100`;
  });

  barColorClass = computed(() => {
    if (this.color() !== 'auto') {
      const map = { indigo: 'bg-indigo-500', green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500', auto: '' };
      return map[this.color()];
    }
    const v = this.clampedValue();
    if (v >= 80) return 'bg-green-500';
    if (v >= 60) return 'bg-yellow-500';
    if (v >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  });

  textColorClass = computed(() => {
    if (this.color() !== 'auto') {
      const map = { indigo: 'text-indigo-600', green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600', auto: '' };
      return map[this.color()];
    }
    const v = this.clampedValue();
    if (v >= 80) return 'text-green-600';
    if (v >= 60) return 'text-yellow-600';
    if (v >= 40) return 'text-orange-600';
    return 'text-red-600';
  });
}
