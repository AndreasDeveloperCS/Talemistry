import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function calendarLocalToUtc(
  date: string,      // "2025-07-24"
  time: string,      // "09:00"
  calendarTz: string
): Date {
  return fromZonedTime(`${date}T${time}:00`, calendarTz);
}

export function utcToViewerTz(
  utcDate: Date,
  viewerTz: string
): Date {
  return toZonedTime(utcDate, viewerTz);
}