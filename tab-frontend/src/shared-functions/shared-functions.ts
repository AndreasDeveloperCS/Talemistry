import { Weekday } from "../app/modules/meetings/models/schedule";

export function getPropertyName<T>(accessor: (proxy: T) => any): string {
  const proxy = new Proxy(
    {},
    {
      get: (_, prop) => prop,
    }
  );
  return accessor(proxy as T) as string;
}

export function LogClass(constructor: Function) {
  // console.log('LogClass decorator executed for the constructor:');
  // console.log(constructor);
}

export function convertArrayToMap<T extends { code: string, _id: string }>(arr: T[]): Map<string, T> {
  const map = new Map<string, T>();
  arr.forEach(item => {
    map.set(item._id, item);
  });
  return map;
}

export function toLocalDateString(date: Date): string {
  //console.log('toLocalDateString', date);
  const d = date ? new Date(date) : new Date(); // fallback to today
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
export function mergeDateAndTime(date: Date | undefined, time: Date | undefined): Date {
  //console.log('mergeDateAndTime', date, time);

  const d = date ? new Date(date) : new Date(); // fallback to today
  const t = time ? new Date(time) : new Date(0); // fallback to 00:00

  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    t.getHours(),
    t.getMinutes(),
    t.getSeconds(),
    t.getMilliseconds()
  );
}

export function formatWeekdaysWithRanges(weekDays: number[] = []): string {
  if (!weekDays.length) {
    return "";
  }

  // Sort the weekdays numerically
  const sorted = [...weekDays].sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = sorted[0];
  let end = start;

  for (let i = 1; i <= sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      if (start === end) {
        ranges.push(Weekday[start]);
      } else {
        ranges.push(`${Weekday[start]}-${Weekday[end]}`);
      }
      start = sorted[i];
      end = start;
    }
  }

  return ranges.join(", ");
}
