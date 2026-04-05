import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GamificationService } from '../../../../core/services/gamification.service';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-rewards-page',
  standalone: true,
  imports: [EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Tienda de Premios</h1>
          <p class="text-sm text-gray-500 mt-1">Canjea tus puntos por premios reales</p>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
          <span class="text-lg">🪙</span>
          <div>
            <p class="text-xs text-amber-700">Puntos</p>
            <p class="text-lg font-bold text-amber-800">{{ gamificationService.availablePoints() }}</p>
          </div>
        </div>
      </div>

      <!-- Placeholder for rewards store -->
      <app-empty-state
        icon="🎁"
        title="Proximamente"
        message="La tienda de premios estara disponible pronto. Sigue acumulando puntos completando habitos y subiendo de nivel." />

      <!-- How to earn points -->
      <div class="card p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Como ganar puntos</h2>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-xl">⬆️</span>
            <div>
              <p class="text-sm font-medium text-gray-900">Sube de nivel</p>
              <p class="text-xs text-gray-500">Gana puntos cada vez que subes de nivel</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xl">🔥</span>
            <div>
              <p class="text-sm font-medium text-gray-900">Mantiene rachas</p>
              <p class="text-xs text-gray-500">Rachas largas otorgan bonus de XP y puntos</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xl">🏆</span>
            <div>
              <p class="text-sm font-medium text-gray-900">Desbloquea logros</p>
              <p class="text-xs text-gray-500">Cada logro desbloqueado te da XP extra</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RewardsPageComponent implements OnInit {
  gamificationService = inject(GamificationService);

  ngOnInit(): void {
    this.gamificationService.loadData();
  }
}
