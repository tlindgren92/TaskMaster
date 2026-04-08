import { Provider } from '@angular/core';
import { HABIT_REPOSITORY_TOKEN } from '../interfaces/habit-repository.interface';
import { GAMIFICATION_REPOSITORY_TOKEN } from '../interfaces/gamification-repository.interface';
import { USER_REPOSITORY_TOKEN } from '../interfaces/user-repository.interface';
import { HabitLocalRepository } from '../repositories/habit-local.repository';
import { GamificationLocalRepository } from '../repositories/gamification-local.repository';
import { UserLocalRepository } from '../repositories/user-local.repository';

export const APP_REPOSITORY_PROVIDERS: Provider[] = [
  { provide: HABIT_REPOSITORY_TOKEN, useClass: HabitLocalRepository },
  { provide: GAMIFICATION_REPOSITORY_TOKEN, useClass: GamificationLocalRepository },
  { provide: USER_REPOSITORY_TOKEN, useClass: UserLocalRepository },
];
