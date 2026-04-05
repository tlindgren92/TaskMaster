import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SidebarComponent, BottomNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Desktop sidebar -->
      <app-sidebar />

      <!-- Main content -->
      <main class="lg:pl-64 pb-20 lg:pb-0">
        <div class="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <ng-content />
        </div>
      </main>

      <!-- Mobile bottom nav -->
      <app-bottom-nav />
    </div>
  `,
})
export class AppShellComponent {}
