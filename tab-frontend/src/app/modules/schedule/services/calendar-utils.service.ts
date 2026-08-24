import { Injectable } from "@angular/core";
import { CalendarDay } from "../models/meeting.model";

@Injectable({
  providedIn: "root",
})
export class CalendarUtilsService {
  calendarData: CalendarDay[] = [];

  constructor() {}

  getCalendarDays(currentDate: Date): CalendarDay[] {
    const { startDate, endDate } = this.getCalendarRange(currentDate);

    const days: CalendarDay[] = [];
    const today = new Date();

    const totalDays = 42;
    let date = new Date(startDate);

    for (let i = 0; i < totalDays; i++) {
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();

      days.push({
        date: new Date(date),
        isCurrentMonth,
        isToday: date.toDateString() === today.toDateString(),
        meetings: [],
        timeFrames: [],
      });

      date.setDate(date.getDate() + 1);
    }

    return days;
  }

  getCalendarRange(currentDate: Date): { startDate: Date; endDate: Date } {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();

    const startDate = new Date(year, month, 1 - firstDayOfWeek);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 41);

    return { startDate, endDate };
  }

  getWeekViewRange(selectedDate: Date): { startOfWeek: Date; endOfWeek: Date } {
    const date = new Date(selectedDate); 
    const dayOfWeek = date.getDay(); 

    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return { startOfWeek, endOfWeek };
  }

  getWeekRange(weekDays: any[]): string {
    return `${weekDays[0].date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${weekDays[6].date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`
  }

  getWorkingHours(): number[] {
    return Array.from({ length: 11 }, (_, i) => i + 8) 
  }

  getExtendedHours(): number[] {
    return Array.from({ length: 17 }, (_, i) => i + 6)
  }

  getWeekDays(currentDate: Date): CalendarDay[] {
    const startOfWeek = this.getStartOfWeek(currentDate)
    const weekDays: CalendarDay[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)

      const dayData = this.calendarData.find((d) => d.date.toDateString() === date.toDateString())

      if (dayData) {
        weekDays.push(dayData)
      } else {
        weekDays.push({
          date: new Date(date),
          isCurrentMonth: true,
          isToday: this.isToday(date),
          meetings: [],
          timeFrames: [],
        })
      }
    }

    return weekDays
  }

  getDayData(date: Date): CalendarDay {
    const dayData = this.calendarData.find((d) => d.date.toDateString() === date.toDateString())

    if (dayData) {
      return dayData
    }

    return {
      date: new Date(date),
      isCurrentMonth: true,
      isToday: this.isToday(date),
      meetings: [],
      timeFrames: [],
    }
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  private isToday(date: Date): boolean {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
}