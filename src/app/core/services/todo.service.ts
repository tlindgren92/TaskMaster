import { Injectable, Inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ITodoRepository, TODO_REPOSITORY_TOKEN } from '../interfaces/todo-repository.interface';
import { Todo, TodoCreateRequest, TodoUpdateRequest, TodoFilters, Priority } from '../../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private todosSubject = new BehaviorSubject<Todo[]>([]);
  private filtersSubject = new BehaviorSubject<TodoFilters>({});
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public todos$ = this.todosSubject.asObservable();
  public filters$ = this.filtersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  public filteredTodos$ = combineLatest([this.todos$, this.filters$]).pipe(
    map(([todos, filters]) => this.applyFilters(todos, filters))
  );

  public completedTodos$ = this.todos$.pipe(
    map(todos => todos.filter(todo => todo.completed))
  );

  public pendingTodos$ = this.todos$.pipe(
    map(todos => todos.filter(todo => !todo.completed))
  );

  public urgentTodos$ = this.todos$.pipe(
    map(todos => todos.filter(todo => todo.priority === Priority.URGENT && !todo.completed))
  );

  public categories$ = this.todos$.pipe(
    map(todos => {
      const categories = todos
        .map(t => t.category)
        .filter((category): category is string => Boolean(category));
      return [...new Set(categories)];
    })
  );

  constructor(@Inject(TODO_REPOSITORY_TOKEN) private todoRepository: ITodoRepository) {
    this.loadTodos();
  }

  private applyFilters(todos: Todo[], filters: TodoFilters): Todo[] {
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

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  loadTodos(): void {
    this.setLoading(true);
    this.todoRepository.getAll().pipe(
      tap(todos => {
        this.todosSubject.next(todos);
        this.setLoading(false);
      })
    ).subscribe();
  }

  createTodo(todoRequest: TodoCreateRequest): Observable<Todo> {
    this.setLoading(true);
    return this.todoRepository.create(todoRequest).pipe(
      tap(newTodo => {
        const currentTodos = this.todosSubject.value;
        this.todosSubject.next([...currentTodos, newTodo]);
        this.setLoading(false);
      })
    );
  }

  updateTodo(id: string, updateRequest: TodoUpdateRequest): Observable<Todo> {
    this.setLoading(true);
    return this.todoRepository.update(id, updateRequest).pipe(
      tap(updatedTodo => {
        const currentTodos = this.todosSubject.value;
        const updatedTodos = currentTodos.map(todo =>
          todo.id === id ? updatedTodo : todo
        );
        this.todosSubject.next(updatedTodos);
        this.setLoading(false);
      })
    );
  }

  deleteTodo(id: string): Observable<boolean> {
    this.setLoading(true);
    return this.todoRepository.delete(id).pipe(
      tap(() => {
        const currentTodos = this.todosSubject.value;
        const filteredTodos = currentTodos.filter(todo => todo.id !== id);
        this.todosSubject.next(filteredTodos);
        this.setLoading(false);
      })
    );
  }

  toggleComplete(id: string): Observable<Todo> {
    this.setLoading(true);
    return this.todoRepository.toggleComplete(id).pipe(
      tap(updatedTodo => {
        const currentTodos = this.todosSubject.value;
        const updatedTodos = currentTodos.map(todo =>
          todo.id === id ? updatedTodo : todo
        );
        this.todosSubject.next(updatedTodos);
        this.setLoading(false);
      })
    );
  }

  setFilters(filters: TodoFilters): void {
    this.filtersSubject.next(filters);
  }

  clearFilters(): void {
    this.filtersSubject.next({});
  }

  getTodoById(id: string): Observable<Todo | null> {
    return this.todoRepository.getById(id);
  }

  getCategories(): Observable<string[]> {
    return this.todoRepository.getCategories();
  }

  // Métodos de utilidad para estadísticas
  getStats() {
    return this.todos$.pipe(
      map(todos => {
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const pending = total - completed;
        const urgent = todos.filter(t => t.priority === Priority.URGENT && !t.completed).length;

        return {
          total,
          completed,
          pending,
          urgent,
          completionRate: total > 0 ? (completed / total) * 100 : 0
        };
      })
    );
  }
}
