import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { ITodoRepository } from '../interfaces/todo-repository.interface';
import { Todo, TodoCreateRequest, TodoUpdateRequest, TodoFilters, Priority } from '../../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoLocalRepository implements ITodoRepository {
  private readonly STORAGE_KEY = 'todos';
  private readonly DELAY_MS = 100; // Simular latencia de red

  constructor() {}

  private getTodosFromStorage(): Todo[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];

    const todos = JSON.parse(stored);
    return todos.map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
      dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
    }));
  }

  private saveTodosToStorage(todos: Todo[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private filterTodos(todos: Todo[], filters?: TodoFilters): Todo[] {
    if (!filters) return todos;

    return todos.filter(todo => {
      if (filters.completed !== undefined && todo.completed !== filters.completed) {
        return false;
      }
      if (filters.priority && todo.priority !== filters.priority) {
        return false;
      }
      if (filters.category && todo.category !== filters.category) {
        return false;
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = todo.title.toLowerCase().includes(searchLower);
        const matchesDescription = todo.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }
      return true;
    });
  }

  getAll(filters?: TodoFilters): Observable<Todo[]> {
    const todos = this.getTodosFromStorage();
    const filteredTodos = this.filterTodos(todos, filters);
    return of(filteredTodos).pipe(delay(this.DELAY_MS));
  }

  getById(id: string): Observable<Todo | null> {
    const todos = this.getTodosFromStorage();
    const todo = todos.find(t => t.id === id);
    return of(todo || null).pipe(delay(this.DELAY_MS));
  }

  create(todoRequest: TodoCreateRequest): Observable<Todo> {
    const todos = this.getTodosFromStorage();
    const newTodo: Todo = {
      id: this.generateId(),
      title: todoRequest.title,
      description: todoRequest.description,
      completed: false,
      priority: todoRequest.priority || Priority.MEDIUM,
      category: todoRequest.category,
      dueDate: todoRequest.dueDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    todos.push(newTodo);
    this.saveTodosToStorage(todos);
    return of(newTodo).pipe(delay(this.DELAY_MS));
  }

  update(id: string, updateRequest: TodoUpdateRequest): Observable<Todo> {
    const todos = this.getTodosFromStorage();
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      return throwError(() => new Error('Todo not found'));
    }

    todos[index] = {
      ...todos[index],
      ...updateRequest,
      updatedAt: new Date()
    };

    this.saveTodosToStorage(todos);
    return of(todos[index]).pipe(delay(this.DELAY_MS));
  }

  delete(id: string): Observable<boolean> {
    const todos = this.getTodosFromStorage();
    const filteredTodos = todos.filter(t => t.id !== id);

    if (filteredTodos.length === todos.length) {
      return throwError(() => new Error('Todo not found'));
    }

    this.saveTodosToStorage(filteredTodos);
    return of(true).pipe(delay(this.DELAY_MS));
  }

  toggleComplete(id: string): Observable<Todo> {
    const todos = this.getTodosFromStorage();
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      return throwError(() => new Error('Todo not found'));
    }

    todos[index] = {
      ...todos[index],
      completed: !todos[index].completed,
      updatedAt: new Date()
    };

    this.saveTodosToStorage(todos);
    return of(todos[index]).pipe(delay(this.DELAY_MS));
  }

  getCategories(): Observable<string[]> {
    const todos = this.getTodosFromStorage();
    const categories = todos
      .map(t => t.category)
      .filter((category): category is string => Boolean(category));
    const uniqueCategories = [...new Set(categories)];
    return of(uniqueCategories).pipe(delay(this.DELAY_MS));
  }
}
