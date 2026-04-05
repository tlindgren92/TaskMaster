import { Routes } from '@angular/router';

export const HABIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/habits-page/habits-page.component').then(m => m.HabitsPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/habit-detail-page/habit-detail-page.component').then(m => m.HabitDetailPageComponent),
  },
];
