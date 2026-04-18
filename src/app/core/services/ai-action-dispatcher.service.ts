import { Injectable, inject } from '@angular/core';
import { Observable, of, map, catchError } from 'rxjs';
import { HabitService } from './habit.service';
import {
  AIToolCall,
  AIToolResult,
  AIActionChip,
} from '../../models/ai.model';
import {
  Habit,
  HabitCategory,
  HabitType,
  HabitFrequency,
  HabitCreateRequest,
  HabitUpdateRequest,
} from '../../models/habit.model';

export interface AIDispatchOutcome {
  toolResult: AIToolResult;
  chip: AIActionChip;
}

@Injectable({ providedIn: 'root' })
export class AIActionDispatcherService {
  private habitService = inject(HabitService);

  execute(call: AIToolCall): Observable<AIDispatchOutcome> {
    switch (call.name) {
      case 'create_habit':
        return this.handleCreate(call);
      case 'adjust_habit':
        return this.handleAdjust(call);
      case 'archive_habit':
        return this.handleArchive(call);
      default:
        return of(this.fail(call, `Herramienta no soportada: ${call.name}`));
    }
  }

  private handleCreate(call: AIToolCall): Observable<AIDispatchOutcome> {
    const req = this.buildCreateRequest(call.args);
    if (typeof req === 'string') return of(this.fail(call, req));

    return this.habitService.createHabitReturning(req).pipe(
      map(habit => this.success(call, '✨', `Habito creado: "${habit.title}"`, habit, {
        habitId: habit.id,
        title: habit.title,
        category: habit.category,
        frequency: habit.frequency,
      })),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleAdjust(call: AIToolCall): Observable<AIDispatchOutcome> {
    const habitId = this.asString(call.args['habitId']);
    if (!habitId) return of(this.fail(call, 'Falta habitId'));

    const existing = this.habitService.habits().find(h => h.id === habitId);
    if (!existing) return of(this.fail(call, `Habito no encontrado: ${habitId}`));

    const patch = this.buildUpdateRequest(call.args);
    if (Object.keys(patch).length === 0) {
      return of(this.fail(call, 'Nada que ajustar: pasa al menos un campo ademas de habitId'));
    }

    return this.habitService.updateHabitReturning(habitId, patch).pipe(
      map(habit => this.success(call, '🛠️', `Habito ajustado: "${habit.title}"`, habit, {
        habitId: habit.id,
        changes: patch,
      })),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private handleArchive(call: AIToolCall): Observable<AIDispatchOutcome> {
    const habitId = this.asString(call.args['habitId']);
    if (!habitId) return of(this.fail(call, 'Falta habitId'));

    const existing = this.habitService.habits().find(h => h.id === habitId);
    if (!existing) return of(this.fail(call, `Habito no encontrado: ${habitId}`));

    return this.habitService.archiveHabitReturning(habitId).pipe(
      map(habit => this.success(call, '📦', `Habito archivado: "${habit.title}"`, habit, {
        habitId: habit.id,
      })),
      catchError(err => of(this.fail(call, this.errorMessage(err)))),
    );
  }

  private buildCreateRequest(args: Record<string, unknown>): HabitCreateRequest | string {
    const title = this.asString(args['title']);
    const category = this.asEnum(args['category'], HabitCategory);
    const type = this.asEnum(args['type'], HabitType);
    const frequency = this.asEnum(args['frequency'], HabitFrequency);

    if (!title) return 'Falta title';
    if (!category) return 'Categoria invalida';
    if (!type) return 'Tipo invalido (build|break)';
    if (!frequency) return 'Frecuencia invalida';

    const req: HabitCreateRequest = { title, category, type, frequency };
    const description = this.asString(args['description']);
    if (description) req.description = description;
    const reminderTime = this.asString(args['reminderTime']);
    if (reminderTime) req.reminderTime = reminderTime;
    const icon = this.asString(args['icon']);
    if (icon) req.icon = icon;
    return req;
  }

  private buildUpdateRequest(args: Record<string, unknown>): HabitUpdateRequest {
    const patch: HabitUpdateRequest = {};
    const title = this.asString(args['title']);
    if (title) patch.title = title;
    const description = this.asString(args['description']);
    if (description !== null) patch.description = description ?? undefined;
    const category = this.asEnum(args['category'], HabitCategory);
    if (category) patch.category = category;
    const frequency = this.asEnum(args['frequency'], HabitFrequency);
    if (frequency) patch.frequency = frequency;
    if ('reminderTime' in args) {
      const rt = this.asString(args['reminderTime']);
      patch.reminderTime = rt ?? undefined;
    }
    const icon = this.asString(args['icon']);
    if (icon) patch.icon = icon;
    return patch;
  }

  private success(
    call: AIToolCall,
    icon: string,
    summary: string,
    habit: Habit,
    payload: Record<string, unknown>,
  ): AIDispatchOutcome {
    return {
      toolResult: {
        toolCallId: call.id,
        toolName: call.name,
        content: JSON.stringify({ ok: true, ...payload }),
        isError: false,
      },
      chip: {
        id: call.id,
        toolName: call.name,
        icon,
        summary,
        status: 'success',
        resourceId: habit.id,
        resourceRoute: `/habits/${habit.id}`,
      },
    };
  }

  private fail(call: AIToolCall, message: string): AIDispatchOutcome {
    return {
      toolResult: {
        toolCallId: call.id,
        toolName: call.name,
        content: JSON.stringify({ ok: false, error: message }),
        isError: true,
      },
      chip: {
        id: call.id,
        toolName: call.name,
        icon: '⚠️',
        summary: `No se pudo ejecutar ${call.name}`,
        status: 'error',
        errorMessage: message,
      },
    };
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private asEnum<T extends Record<string, string>>(value: unknown, enumObj: T): T[keyof T] | null {
    if (typeof value !== 'string') return null;
    const v = value.toLowerCase();
    const match = Object.values(enumObj).find(e => e === v);
    return (match as T[keyof T]) ?? null;
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'Error desconocido';
  }
}
