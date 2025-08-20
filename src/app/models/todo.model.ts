export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  category?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TodoFilters {
  completed?: boolean;
  priority?: Priority;
  category?: string;
  searchTerm?: string;
}

export interface TodoCreateRequest {
  title: string;
  description?: string;
  priority?: Priority;
  category?: string;
  dueDate?: Date;
}

export interface TodoUpdateRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  category?: string;
  dueDate?: Date;
}
