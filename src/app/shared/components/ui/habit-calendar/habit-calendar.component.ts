import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { HabitCompletion } from '../../../../models/habit.model';
import { startOfDay, isSameDay, formatDateShort } from '../../../../core/utils/date.utils';

interface CalendarDay {
  date: Date;
  completed: boolean;
  count: number;
  isToday: boolean;
  isFuture: boolean;
  monthLabel?: string;
}

@Component({
  selector: 'app-habit-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <!-- Month labels -->
      <div class="flex text-xs text-gray-400 mb-1">
        @for (month of monthLabels(); track month.index) {
          <span [style.margin-left.px]="month.offset" class="select-none">{{ month.name }}</span>
        }
      </div>

      <!-- Day labels + Grid -->
      <div class="flex gap-1">
        <!-- Day of week labels -->
        <div class="flex flex-col gap-1 mr-1 text-xs text-gray-400 select-none">
          <span class="h-3 leading-3">&nbsp;</span>
          <span class="h-3 leading-3">L</span>
          <span class="h-3 leading-3">&nbsp;</span>
          <span class="h-3 leading-3">M</span>
          <span class="h-3 leading-3">&nbsp;</span>
          <span class="h-3 leading-3">V</span>
          <span class="h-3 leading-3">&nbsp;</span>
        </div>

        <!-- Calendar grid -->
        <div class="flex gap-[3px] overflow-x-auto scrollbar-hide">
          @for (week of weeksData(); track $index) {
            <div class="flex flex-col gap-[3px]">
              @for (day of week; track day.date.getTime()) {
                @if (day.isFuture) {
                  <div class="w-3 h-3 rounded-sm bg-transparent"></div>
                } @else {
                  <div
                    class="w-3 h-3 rounded-sm transition-colors cursor-default"
                    [class]="getCellClass(day)"
                    [title]="getCellTitle(day)">
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>{{ totalCompletionsInPeriod() }} completados en {{ totalDays() }} dias</span>
        <div class="flex items-center gap-1">
          <span>Menos</span>
          <div class="w-3 h-3 rounded-sm bg-gray-100"></div>
          <div class="w-3 h-3 rounded-sm bg-green-200"></div>
          <div class="w-3 h-3 rounded-sm bg-green-400"></div>
          <div class="w-3 h-3 rounded-sm bg-green-600"></div>
          <span>Mas</span>
        </div>
      </div>
    </div>
  `,
})
export class HabitCalendarComponent {
  completions = input<HabitCompletion[]>([]);
  numWeeks = input(16);

  calendarDays = computed<CalendarDay[]>(() => {
    const completions = this.completions();
    const today = startOfDay(new Date());
    const totalDays = this.numWeeks() * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Align to start of week (Monday)
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const days: CalendarDay[] = [];
    const current = new Date(startDate);

    while (current <= today || days.length % 7 !== 0 || days.length < totalDays) {
      const date = new Date(current);
      const dayCompletions = completions.filter(c =>
        isSameDay(new Date(c.completedAt), date)
      );

      days.push({
        date,
        completed: dayCompletions.length > 0,
        count: dayCompletions.length,
        isToday: isSameDay(date, today),
        isFuture: date > today,
        monthLabel: date.getDate() === 1 ? date.toLocaleDateString('es-ES', { month: 'short' }) : undefined,
      });

      current.setDate(current.getDate() + 1);

      // Safety limit
      if (days.length > totalDays + 7) break;
    }

    return days;
  });

  weeksData = computed(() => {
    const days = this.calendarDays();
    const result: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  });

  monthLabels = computed(() => {
    const weeks = this.weeksData();
    const labels: { name: string; offset: number; index: number }[] = [];
    let lastMonth = -1;

    for (let i = 0; i < weeks.length; i++) {
      const firstDay = weeks[i][0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            name: firstDay.date.toLocaleDateString('es-ES', { month: 'short' }),
            offset: i === 0 ? 0 : 2,
            index: i,
          });
          lastMonth = month;
        }
      }
    }
    return labels;
  });

  totalCompletionsInPeriod = computed(() => {
    return this.calendarDays().filter(d => d.completed).length;
  });

  totalDays = computed(() => {
    return this.calendarDays().filter(d => !d.isFuture).length;
  });

  getCellClass(day: CalendarDay): string {
    const base = day.isToday ? 'ring-1 ring-indigo-400 ' : '';
    if (day.count === 0) return base + 'bg-gray-100';
    if (day.count === 1) return base + 'bg-green-200';
    if (day.count <= 3) return base + 'bg-green-400';
    return base + 'bg-green-600';
  }

  getCellTitle(day: CalendarDay): string {
    const dateStr = formatDateShort(day.date);
    if (day.count === 0) return `${dateStr}: sin completar`;
    return `${dateStr}: ${day.count} completado${day.count > 1 ? 's' : ''}`;
  }
}
