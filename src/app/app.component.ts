import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from './shared/components/layout/app-shell/app-shell.component';
import { ToastComponent } from './shared/components/ui/toast/toast.component';
import { XpPopupComponent } from './shared/components/ui/xp-popup/xp-popup.component';
import { LevelUpModalComponent } from './shared/components/ui/level-up-modal/level-up-modal.component';
import { AchievementToastComponent } from './shared/components/ui/achievement-toast/achievement-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, AppShellComponent, ToastComponent,
    XpPopupComponent, LevelUpModalComponent, AchievementToastComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
    <app-toast />
    <app-xp-popup />
    <app-level-up-modal />
    <app-achievement-toast />
  `,
})
export class AppComponent {}
