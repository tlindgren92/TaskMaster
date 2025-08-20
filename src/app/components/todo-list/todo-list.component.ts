import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TodoService } from '../../core/services/todo.service';
import { Todo, Priority, TodoFilters } from '../../models/todo.model';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { TodoFormComponent } from '../todo-form/todo-form.component';
import { TodoFiltersComponent } from '../todo-filters/todo-filters.component';
import { TodoStatsComponent } from '../todo-stats/todo-stats.component';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TodoItemComponent,
    TodoFormComponent,
    TodoFiltersComponent,
    TodoStatsComponent
  ],
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css']
})
export class TodoListComponent implements OnInit, OnDestroy {
  todos: Todo[] = [];
  loading = false;
  showCompleted = true;
  searchTerm = '';
  selectedPriority: Priority | '' = '';
  selectedCategory = '';
  categories: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.todoService.filteredTodos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(todos => {
        this.todos = todos;
      });

    this.todoService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    this.todoService.categories$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleComplete(todo: Todo): void {
    this.todoService.toggleComplete(todo.id).subscribe();
  }

  onDeleteTodo(todo: Todo): void {
    this.todoService.deleteTodo(todo.id).subscribe();
  }

  onUpdateTodo(todo: Todo): void {
    // Esta funcionalidad se implementará en el componente TodoItem
  }

  onFiltersChange(filters: TodoFilters): void {
    this.todoService.setFilters(filters);
  }

  onClearFilters(): void {
    this.todoService.clearFilters();
  }

  getPriorityColor(priority: Priority): string {
    switch (priority) {
      case Priority.LOW: return 'text-green-600 bg-green-100';
      case Priority.MEDIUM: return 'text-yellow-600 bg-yellow-100';
      case Priority.HIGH: return 'text-orange-600 bg-orange-100';
      case Priority.URGENT: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getPriorityLabel(priority: Priority): string {
    switch (priority) {
      case Priority.LOW: return 'Baja';
      case Priority.MEDIUM: return 'Media';
      case Priority.HIGH: return 'Alta';
      case Priority.URGENT: return 'Urgente';
      default: return 'Sin prioridad';
    }
  }

  getCompletedTodos(): Todo[] {
    return this.todos.filter(t => t.completed);
  }
}
