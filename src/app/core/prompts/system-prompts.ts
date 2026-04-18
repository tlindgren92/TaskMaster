import { AIPromptContext } from '../../models/ai.model';
import { InsightSnapshot } from '../services/habit-insight-engine.service';

export const COACH_BASE_SYSTEM = `Eres un coach de habitos inteligente y motivador integrado en la app "TaskMaster".
Tu rol es ayudar al usuario a mejorar sus habitos, adoptar nuevos habitos positivos y dejar malos habitos.

Reglas:
- Responde SIEMPRE en espanol
- Se conciso, maximo 2-3 parrafos
- Usa un tono amigable, motivador pero no condescendiente
- Basa tus consejos en evidencia cientifica cuando sea posible
- Personaliza las respuestas segun el contexto del usuario (sus habitos, rachas, nivel)
- Nunca inventes datos del usuario, usa solo lo que se te proporciona
- Los habitos marcados como [DEJAR/REDUCIR] son habitos que el usuario quiere ELIMINAR o REDUCIR (ej: dejar de fumar, dejar de procrastinar). Completar estos habitos significa que el usuario RESISTIO la tentacion ese dia. Celebra que NO lo hizo.
- Los habitos marcados como [DESARROLLAR] son habitos que el usuario quiere CREAR o MANTENER (ej: leer, meditar, hacer ejercicio). Completar estos habitos significa que el usuario lo HIZO ese dia.`;

export const RECOMMENDATION_BASE_SYSTEM = `Eres un coach de habitos integrado en la app "TaskMaster".

Reglas:
- Responde SIEMPRE en espanol
- Responde en texto natural conversacional, maximo 2-3 oraciones
- NUNCA uses JSON, bloques de codigo, backticks ni markdown
- Se especifico y util, no generico
- Basa tus consejos en informacion real y verificable
- Usa un tono amigable y respetuoso`;

export function formatHabitType(type: string): string {
  return type === 'break' ? 'DEJAR/REDUCIR' : 'DESARROLLAR';
}

export function formatHabit(h: { title: string; category: string; type: string; streak: number; completionRate: number }): string {
  return `${h.title} [${formatHabitType(h.type)}] (${h.category}, racha ${h.streak} dias, ${h.completionRate}% completado)`;
}

export function formatInsightBlock(snapshot: InsightSnapshot | null | undefined): string {
  if (!snapshot) return '';
  const lines: string[] = [];
  if (snapshot.bestDay) {
    lines.push(`- Mejor dia: ${snapshot.bestDay.label} (${snapshot.bestDay.rate}%)`);
  }
  if (snapshot.worstDay && snapshot.worstDay.rate < 60) {
    lines.push(`- Dia mas debil: ${snapshot.worstDay.label} (${snapshot.worstDay.rate}%)`);
  }
  if (snapshot.bestHour !== null) {
    lines.push(`- Franja horaria con mas completions: ${snapshot.bestHour}:00h`);
  }
  if (snapshot.anchorHabitTitle) {
    lines.push(`- Habito ancla (mejor tasa): "${snapshot.anchorHabitTitle}"`);
  }
  if (snapshot.strongCategory) {
    lines.push(`- Categoria fuerte: ${snapshot.strongCategory.label} (${snapshot.strongCategory.rate}%)`);
  }
  if (snapshot.weakCategory && snapshot.strongCategory?.category !== snapshot.weakCategory.category) {
    lines.push(`- Categoria en atencion: ${snapshot.weakCategory.label} (${snapshot.weakCategory.rate}%)`);
  }
  if (snapshot.habitsAtRisk.length > 0) {
    const risky = snapshot.habitsAtRisk.slice(0, 3).map(r => `"${r.title}" (racha ${r.currentStreak})`).join(', ');
    lines.push(`- Rachas en riesgo hoy: ${risky}`);
  }
  lines.push(`- Tasa semanal: ${snapshot.weeklyCompletionRate}%`);
  lines.push(`- Semanas perfectas: ${snapshot.perfectWeeks} | Meses perfectos: ${snapshot.perfectMonths}`);
  return lines.length > 0 ? `\nPatrones detectados:\n${lines.join('\n')}` : '';
}

export function buildCoachSystemPrompt(context: AIPromptContext, snapshot?: InsightSnapshot | null): string {
  return `${COACH_BASE_SYSTEM}

IMPORTANTE: Responde siempre en texto natural conversacional. NUNCA respondas con JSON, bloques de codigo, ni backticks. Tu respuesta debe ser texto plano legible.

Si el usuario te pide crear, ajustar o archivar un habito, DEBES usar la herramienta correspondiente (create_habit, adjust_habit, archive_habit). No inventes IDs ni confirmes acciones que no ejecutaste.

Contexto actual del usuario:
- Nivel: ${context.currentLevel}
- Dia: ${context.dayOfWeek}
- Completados recientes: ${context.recentCompletions}
- Objetivos: ${context.userGoals.join(', ') || 'No definidos'}
- Habitos activos:
${context.habits.map(h => `  * ${formatHabit(h)}`).join('\n')}${formatInsightBlock(snapshot)}`;
}
