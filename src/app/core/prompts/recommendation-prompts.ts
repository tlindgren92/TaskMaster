import { HabitWithStats } from '../../models/habit.model';

export function buildRecommendationPrompt(habit: HabitWithStats, reflection?: string): string {
  const typeLabel = habit.type === 'build' ? 'construir' : 'dejar/reducir';
  return `El usuario acaba de completar su habito "${habit.title}" (categoria: ${habit.category}, tipo: ${typeLabel}).
Racha actual: ${habit.streak.currentStreak} dias. Tasa de completado: ${habit.completionRate}%.
${reflection ? `El usuario compartio: "${reflection}"` : 'El usuario no compartio detalles adicionales.'}

Genera UNA recomendacion breve y personalizada:
${reflection
  ? '- Relaciona tu recomendacion directamente con lo que el usuario compartio\n- Si menciono un libro, recomienda algo similar. Si menciono ejercicio, sugiere variaciones o tips'
  : '- Da un consejo practico y especifico para su categoria de habito'}
- Se especifico y util, no generico
- Maximo 2-3 oraciones

IMPORTANTE: Solo texto natural, sin JSON, sin markdown, sin backticks.`;
}

export function buildMissedHabitPrompt(habit: HabitWithStats): string {
  return `El usuario tiene el habito "${habit.title}" (tipo: dejar/reducir, categoria: ${habit.category}).
Hoy NO marco este habito como completado. Racha previa: ${habit.streak.currentStreak} dias.

Genera un mensaje breve, empatico y objetivo:
- NO asustar ni culpar al usuario
- Comparte un dato informativo y positivo sobre los beneficios de mantener esta decision
- Invita gentilmente a retomar manana
- Tono: como un amigo que apoya, no como un doctor que regana
- Se delicado, especialmente con temas de salud o adicciones
- Maximo 2-3 oraciones

IMPORTANTE: Solo texto natural, sin JSON, sin markdown, sin backticks.`;
}
