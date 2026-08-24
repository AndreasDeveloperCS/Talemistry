import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ 
  name: 'monthYearRange',
  standalone: false 
})
export class MonthYearRangePipe implements PipeTransform {
  transform(start: string | Date, end: string | Date, isCurrent: boolean | undefined): string {
    const format = (date?: string | Date) =>
      date
        ? new Date(date).toLocaleString('en-US', {
            month: 'long',
            year: 'numeric'
          })
        : '';

    const startFormatted = format(start);
    const endFormatted = isCurrent ? 'Present' : format(end);

    return `${startFormatted} - ${endFormatted}`;
  }
}