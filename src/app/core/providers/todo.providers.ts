import { Provider } from '@angular/core';
import { ITodoRepository, TODO_REPOSITORY_TOKEN } from '../interfaces/todo-repository.interface';
import { TodoLocalRepository } from '../repositories/todo-local.repository';

export const TODO_REPOSITORY_PROVIDER: Provider = {
  provide: TODO_REPOSITORY_TOKEN,
  useClass: TodoLocalRepository
};
