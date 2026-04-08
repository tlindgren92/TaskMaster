import { Pipe, PipeTransform } from '@angular/core';
import { formatRelativeDate } from '../../core/utils/date.utils';

@Pipe({
  name: 'relativeDate',
  standalone: true,
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: Date | string | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    return formatRelativeDate(date);
  }
}
