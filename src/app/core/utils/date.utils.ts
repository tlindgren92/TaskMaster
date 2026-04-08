export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

export function daysBetween(a: Date, b: Date): number {
  const startA = startOfDay(a).getTime();
  const startB = startOfDay(b).getTime();
  return Math.round((startB - startA) / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function isSameWeek(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    getWeekNumber(a) === getWeekNumber(b)
  );
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'hace un momento';
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'ayer';
  if (diffDays < 7) return `hace ${diffDays} dias`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
  return `hace ${Math.floor(diffDays / 365)} anos`;
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

export function getDayOfWeekName(dayOfWeek: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  return days[dayOfWeek] ?? '';
}

export function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = startOfDay(start);
  const endDate = startOfDay(end);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
