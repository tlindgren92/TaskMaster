import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AIConversationMessage } from '../../models/ai.model';

export interface AICoachSession {
  id: string;
  title: string;
  messages: AIConversationMessage[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAICoachRepository {
  getSessions(): Observable<AICoachSession[]>;
  getCurrentSessionId(): Observable<string | null>;
  setCurrentSessionId(sessionId: string | null): Observable<void>;

  saveSession(session: AICoachSession): Observable<AICoachSession>;
  deleteSession(sessionId: string): Observable<void>;

  appendMessage(sessionId: string, message: AIConversationMessage): Observable<AICoachSession>;
  updateSummary(sessionId: string, summary: string): Observable<AICoachSession>;
}

export const AI_COACH_REPOSITORY_TOKEN = new InjectionToken<IAICoachRepository>('AICoachRepository');
