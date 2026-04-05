import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 animate-fade-in"
          (click)="onClose()">
        </div>
        <!-- Modal -->
        <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full animate-bounce-in overflow-hidden">
          <!-- Header -->
          @if (title()) {
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900">{{ title() }}</h3>
              <button
                (click)="onClose()"
                class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          }
          <!-- Body -->
          <div class="px-6 py-4">
            <ng-content />
          </div>
          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <ng-content select="[modal-footer]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  isOpen = input(false);
  title = input('');
  closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }
}
