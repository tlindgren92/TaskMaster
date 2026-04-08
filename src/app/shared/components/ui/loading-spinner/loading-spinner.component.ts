import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center" [class]="sizeClass()">
      <div class="border-2 border-gray-200 rounded-full animate-spin" [class]="spinnerClass()" [style.border-top-color]="'#6366f1'"></div>
      @if (message()) {
        <span class="ml-3 text-sm text-gray-500">{{ message() }}</span>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  message = input('');

  sizeClass() {
    return this.size() === 'lg' ? 'py-12' : this.size() === 'md' ? 'py-6' : 'py-2';
  }

  spinnerClass() {
    switch (this.size()) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
    }
  }
}
