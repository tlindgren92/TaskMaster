import { Observable } from 'rxjs';
import { Todo, TodoCreateRequest, TodoUpdateRequest, TodoFilters } from '../../models/todo.model';

export interface ITodoRepository {
  getAll(filters?: TodoFilters): Observable<Todo[]>;
  getById(id: string): Observable<Todo | null>;
  create(todo: TodoCreateRequest): Observable<Todo>;
  update(id: string, todo: TodoUpdateRequest): Observable<Todo>;
  delete(id: string): Observable<boolean>;
  toggleComplete(id: string): Observable<Todo>;
  getCategories(): Observable<string[]>;
}

// Token de inyección
export const TODO_REPOSITORY_TOKEN = Symbol('TodoRepository');
