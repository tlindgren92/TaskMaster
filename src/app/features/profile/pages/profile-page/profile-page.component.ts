import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { GamificationService } from '../../../../core/services/gamification.service';
import { HabitService } from '../../../../core/services/habit.service';
import { XpBarComponent } from '../../../../shared/components/ui/xp-bar/xp-bar.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormsModule, XpBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <h1 class="text-2xl font-bold text-gray-900">Mi Perfil</h1>

      <!-- Profile card -->
      <div class="card p-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
            {{ userService.displayName().charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ userService.displayName() }}</h2>
            <p class="text-sm text-indigo-600 font-medium">
              Nivel {{ gamificationService.userLevel().level }} - {{ gamificationService.userLevel().title }}
            </p>
          </div>
        </div>
        <div class="mt-4">
          <app-xp-bar />
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-indigo-600">{{ habitService.activeHabits().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Habitos activos</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ gamificationService.unlockedAchievements().length }}</p>
          <p class="text-xs text-gray-500 mt-1">Logros</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-amber-600">{{ gamificationService.availablePoints() }}</p>
          <p class="text-xs text-gray-500 mt-1">Puntos</p>
        </div>
      </div>

      <!-- Settings -->
      <div class="card p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Configuracion</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              class="input-field"
              [ngModel]="userService.displayName()"
              (ngModelChange)="updateName($event)"
              name="displayName" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mis objetivos</label>
            <textarea
              class="input-field"
              [ngModel]="goalsText()"
              (ngModelChange)="updateGoals($event)"
              name="goals"
              rows="3"
              placeholder="Ej: Mejorar mi salud, ser mas productivo..."></textarea>
            <p class="text-xs text-gray-400 mt-1">Tus objetivos ayudan al coach IA a darte mejores sugerencias</p>
          </div>
        </div>
      </div>

      <!-- App info -->
      <div class="card p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-2">TaskMaster</h2>
        <p class="text-sm text-gray-500">Version 2.0 - Habitos & IA</p>
        <p class="text-xs text-gray-400 mt-1">Construido con Angular 19 + Tailwind CSS</p>
      </div>
    </div>
  `,
})
export class ProfilePageComponent implements OnInit {
  userService = inject(UserService);
  gamificationService = inject(GamificationService);
  habitService = inject(HabitService);

  ngOnInit(): void {
    this.userService.loadUser();
    this.gamificationService.loadData();
    this.habitService.loadHabits();
  }

  goalsText(): string {
    return this.userService.profile()?.goals?.join(', ') ?? '';
  }

  updateName(name: string): void {
    this.userService.updateProfile({ displayName: name });
  }

  updateGoals(text: string): void {
    const goals = text.split(',').map(g => g.trim()).filter(Boolean);
    this.userService.updateGoals(goals);
  }
}
