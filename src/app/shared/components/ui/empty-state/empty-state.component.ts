import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <span class="text-5xl mb-4">{{ icon() }}</span>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ title() }}</h3>
      @if (message()) {
        <p class="text-sm text-gray-500 max-w-sm">{{ message() }}</p>
      }
      @if (actionLabel()) {
        <button
          (click)="actionClicked.emit()"
          class="mt-4 btn-primary text-sm">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input('📭');
  title = input('Nada por aqui');
  message = input('');
  actionLabel = input('');
  actionClicked = output<void>();
}
