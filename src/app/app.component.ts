import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from './shared/components/layout/app-shell/app-shell.component';
import { ToastComponent } from './shared/components/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppShellComponent, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
    <app-toast />
  `,
})
export class AppComponent {}
