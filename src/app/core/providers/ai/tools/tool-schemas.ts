import { AIToolDefinition } from '../../../../models/ai.model';

export const TOOL_CREATE_HABIT: AIToolDefinition = {
  name: 'create_habit',
  description: 'Crea un nuevo habito para el usuario. Usala cuando el usuario pida crear, agregar o empezar un habito nuevo. Solo envia los campos necesarios, el resto tiene defaults razonables.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Nombre corto del habito (ej: "Meditar 10 minutos")' },
      description: { type: 'string', description: 'Descripcion opcional de 1 frase' },
      category: {
        type: 'string',
        description: 'Categoria del habito',
        enum: ['health', 'productivity', 'mindfulness', 'fitness', 'learning', 'social', 'finance', 'custom'],
      },
      type: {
        type: 'string',
        description: 'build = desarrollar un habito nuevo; break = dejar o reducir un habito existente',
        enum: ['build', 'break'],
      },
      frequency: {
        type: 'string',
        description: 'Con que frecuencia se realiza',
        enum: ['daily', 'weekdays', 'weekends', 'weekly'],
      },
      reminderTime: { type: 'string', description: 'Hora de recordatorio formato HH:mm (opcional)' },
      icon: { type: 'string', description: 'Emoji representativo (opcional)' },
    },
    required: ['title', 'category', 'type', 'frequency'],
  },
};

export const TOOL_ADJUST_HABIT: AIToolDefinition = {
  name: 'adjust_habit',
  description: 'Ajusta campos de un habito existente (titulo, descripcion, frecuencia, categoria, etc). Requiere el habitId del catalogo actual del usuario.',
  inputSchema: {
    type: 'object',
    properties: {
      habitId: { type: 'string', description: 'ID del habito a modificar (tomado del contexto)' },
      title: { type: 'string' },
      description: { type: 'string' },
      category: {
        type: 'string',
        enum: ['health', 'productivity', 'mindfulness', 'fitness', 'learning', 'social', 'finance', 'custom'],
      },
      frequency: {
        type: 'string',
        enum: ['daily', 'weekdays', 'weekends', 'weekly'],
      },
      reminderTime: { type: 'string', description: 'Formato HH:mm o vacio para quitar' },
      icon: { type: 'string' },
    },
    required: ['habitId'],
  },
};

export const TOOL_ARCHIVE_HABIT: AIToolDefinition = {
  name: 'archive_habit',
  description: 'Archiva un habito (lo saca de la lista activa sin borrar historial). Usala cuando el usuario pida pausar, archivar o dejar de seguir un habito.',
  inputSchema: {
    type: 'object',
    properties: {
      habitId: { type: 'string', description: 'ID del habito a archivar' },
    },
    required: ['habitId'],
  },
};

export const AI_TOOL_CATALOG: AIToolDefinition[] = [
  TOOL_CREATE_HABIT,
  TOOL_ADJUST_HABIT,
  TOOL_ARCHIVE_HABIT,
];
