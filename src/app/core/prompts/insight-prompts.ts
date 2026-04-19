import { AIPromptContext } from '../../models/ai.model';
import { InsightSnapshot } from '../services/habit-insight-engine.service';
import { formatHabit, formatInsightBlock } from './system-prompts';

export function buildInsightPrompt(
  context: AIPromptContext,
  previousMessage?: string,
  snapshot?: InsightSnapshot | null,
): string {
  const previousSnippet = previousMessage
    ? previousMessage.replace(/\s+/g, ' ').replace(/"/g, "'").slice(0, 180)
    : '';

  return `Genera un insight diario personalizado para el usuario.

Contexto:
- Dia: ${context.dayOfWeek}
- Nivel: ${context.currentLevel}
- Completados recientes: ${context.recentCompletions}
- Objetivos: ${context.userGoals.join(', ') || 'No definidos'}
- Habitos: ${context.habits.map(h => formatHabit(h)).join('; ')}${formatInsightBlock(snapshot)}
${previousSnippet ? `- Mensaje anterior (NO repetir literal): ${previousSnippet}` : '- Primera generacion del dia'}
- Generacion: ${Date.now()}

Reglas extra:
- Debe estar basado en los habitos del contexto
- Si hay patrones detectados arriba, priorizalos como fuente del insight (usa cifras reales)
- Incluye al menos un detalle concreto (categoria, racha o tasa de completado)
- Si hay mensaje anterior, cambia el angulo y evita frases identicas

IMPORTANTE: Responde UNICAMENTE con el JSON puro, sin bloques de codigo markdown, sin backticks, sin texto adicional:
{"title": "titulo corto del insight", "message": "mensaje de 1-2 oraciones maximo", "type": "positive_trend|streak_risk|habit_correlation|optimal_time|weekly_summary"}`;
}

export function buildSuggestionsPrompt(context: AIPromptContext, snapshot?: InsightSnapshot | null): string {
  return `Sugiere 2-3 habitos que complementen los habitos actuales del usuario.

Contexto:
- Objetivos: ${context.userGoals.join(', ') || 'Mejorar en general'}
- Habitos actuales: ${context.habits.map(h => `${h.title} [${h.type === 'break' ? 'DEJAR/REDUCIR' : 'DESARROLLAR'}] (${h.category})`).join(', ') || 'Ninguno'}
- Nivel: ${context.currentLevel}${formatInsightBlock(snapshot)}

IMPORTANTE: Responde UNICAMENTE con el JSON puro, sin bloques de codigo markdown, sin backticks, sin texto adicional:
[{"title": "titulo del habito sugerido", "description": "por que este habito le beneficiaria (1 oracion)", "type": "new_habit|improvement"}]`;
}
