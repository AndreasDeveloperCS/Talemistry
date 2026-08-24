import { Injectable } from "@angular/core"
import { BehaviorSubject, type Observable } from "rxjs"
import { RepeatPatternOption, TimeFrame } from "../models/scheduled-meeting"
import { CRUDService } from "../../general/services/crud.service"
import { HttpClient } from "@angular/common/http";
import { ScheduleTimeFrame } from "../models/schedule-timeframe";
import { PlanningPerspectiveOption, ScheduleDefaultSettings } from "../models/schedule-default-settings";
import { ScheduleDay } from "../models/scheduled-meeting";
import { environment } from "../../../../environments/environment";
import { CalendarUtilsService } from "./calendar-utils.service";
import { CalendarDay } from "../models/meeting.model";
import { Meeting } from "../../meetings/models/meeting";

@Injectable({
    providedIn: "root",
})
export class ScheduleService extends CRUDService<ScheduleTimeFrame> {

    public settingsModel!: ScheduleDefaultSettings;

    public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.schedule}`;

    // private scheduleTimeFrameSubject = new BehaviorSubject<ScheduleTimeFrame[]>([]);

    // scheduleTimeFrameSubject$: Observable<ScheduleTimeFrame[]> = this.scheduleTimeFrameSubject.asObservable();

    constructor(http: HttpClient,
        private calendarUtils: CalendarUtilsService,
    ) {
        super(http)
    }
    private scheduleSubject = new BehaviorSubject<ScheduleDay[]>([]);
    private settingsSubject = new BehaviorSubject<ScheduleDefaultSettings>(this.settingsModel);
    private timeFramesSubject = new BehaviorSubject<TimeFrame[]>([]);

    public schedule$: Observable<ScheduleDay[]> = this.scheduleSubject.asObservable();
    public settings$: Observable<ScheduleDefaultSettings> = this.settingsSubject.asObservable();
    public timeFrames$: Observable<TimeFrame[]> = this.timeFramesSubject.asObservable();

    getSchedule(): ScheduleDay[] {
        return this.scheduleSubject.getValue()
    }

    updateSchedule(schedule: ScheduleDay[]): void {
        this.scheduleSubject.next(schedule)
    }

    getSettings(): ScheduleDefaultSettings {
        return this.settingsSubject.getValue()
    }

    setTimeFrames(frames: TimeFrame[]): void {
        this.timeFramesSubject.next(frames);
    }

    getTimeFrames(): TimeFrame[] {
        return this.timeFramesSubject.getValue();
    }

    updateSettings(settings: Partial<ScheduleDefaultSettings>): void {
        const currentSettings = this.settingsSubject.getValue()
        const newSettings = { ...currentSettings, ...settings }
        this.settingsSubject.next(newSettings)
    }

    addTimeSlot(date: Date, timeFrame: TimeFrame): void {
        const schedule = this.getSchedule()
        const newSchedule = [...schedule]
        const dayIndex = newSchedule.findIndex((day) => this.isSameDay(new Date(day.date), date))

        if (dayIndex >= 0) {
            newSchedule[dayIndex].timeFrames.push(timeFrame)
        } else {
            newSchedule.push({
                date,
                timeFrames: [timeFrame],
                isAvailable: true,
            })
        }

        this.updateSchedule(newSchedule)
    }

    updateTimeSlot(date: Date, timeSlot: TimeFrame): void {
        const schedule = this.getSchedule()
        const newSchedule = [...schedule]
        const dayIndex = newSchedule.findIndex((day) => this.isSameDay(new Date(day.date), date))

        if (dayIndex >= 0) {
            const timeSlotIndex = newSchedule[dayIndex].timeFrames.findIndex((slot: any) => slot.id === timeSlot.id)

            if (timeSlotIndex >= 0) {
                newSchedule[dayIndex].timeFrames[timeSlotIndex] = timeSlot
                this.updateSchedule(newSchedule)
            }
        }
    }

    deleteTimeSlot(date: Date, timeSlotId: string): void {
        const schedule = this.getSchedule()
        const newSchedule = [...schedule]
        const dayIndex = newSchedule.findIndex((day) => this.isSameDay(new Date(day.date), date))

        if (dayIndex >= 0) {
            newSchedule[dayIndex].timeFrames = newSchedule[dayIndex].timeFrames.filter((slot: any) => slot.id !== timeSlotId)

            if (newSchedule[dayIndex].timeFrames.length === 0) {
                newSchedule[dayIndex].isAvailable = false
            }

            this.updateSchedule(newSchedule)
        }
    }

    getPerspectiveEnd(start: Date, perspective: PlanningPerspectiveOption): Date {
        const end = new Date(start);

        switch (perspective) {
        case PlanningPerspectiveOption.day:
            end.setDate(end.getDate() + 1);
            break;
        case PlanningPerspectiveOption.week:
            end.setDate(end.getDate() + 7);
            break;
        case PlanningPerspectiveOption.fortnight:
            end.setDate(end.getDate() + 14);
            break;
        case PlanningPerspectiveOption.month:
            end.setMonth(end.getMonth() + 1);
            break;
        case PlanningPerspectiveOption.quarter:
            end.setMonth(end.getMonth() + 3);
            break;
        case PlanningPerspectiveOption.year:
            end.setFullYear(end.getFullYear() + 1);
            break;
        default:
            end.setDate(end.getDate() + 30);
            break;
        }
        return end;
    }

    loadCalendarDays(currentDate: Date, perspectiveStart: Date, perspectiveEnd: Date, availableTimeFrames: TimeFrame[], scheduledMeetings: Meeting[]): CalendarDay[] {
        const calendarDays: CalendarDay[] = this.calendarUtils.getCalendarDays(currentDate);
        for (const day of calendarDays) {
            day.timeFrames = this.getTimeFramesForDay(day.date, availableTimeFrames, perspectiveStart, perspectiveEnd);
            day.meetings = this.getMeetingsForDay(day.date, scheduledMeetings);
        }
        return calendarDays;
    }

    loadTimeFrames(currentDate: Date, availableTimeFrames: TimeFrame[], perspectiveStart: Date, perspectiveEnd: Date): CalendarDay[] {
        const calendarDays: CalendarDay[] = this.calendarUtils.getCalendarDays(currentDate);
        for (const day of calendarDays) {
            day.timeFrames = this.getTimeFramesForDay(day.date, availableTimeFrames, perspectiveStart, perspectiveEnd);
        }
        return calendarDays;
    }

    getTimeFramesForDay(dayDate: Date, availableTimeFrames: TimeFrame[], perspectiveStartValue: Date, perspectiveEnd: Date): any {
        const result: TimeFrame[] = [];
        const dayOfWeek = dayDate.getDay(); // 0 (Sun) to 6 (Sat)
        const perspectiveStart = new Date(perspectiveStartValue.getFullYear(), perspectiveStartValue.getMonth(), perspectiveStartValue.getDate());
        // if (dayDate < perspectiveStart || dayDate > perspectiveEnd) {
        //     return result;
        // }

        for (const frame of availableTimeFrames) {
        if (!frame.startDate) {
            return;
        }
        const frameStartDate = new Date(frame.startDate);
        frameStartDate.setHours(0, 0, 0, 0);

        const targetDate = new Date(dayDate);
        targetDate.setHours(0, 0, 0, 0);

        switch (frame.repeatPattern) {
            case RepeatPatternOption.none:
                if (targetDate.getTime() === frameStartDate.getTime()) {
                    result.push(frame);
                }
                break;

            case RepeatPatternOption.daily:
                if (targetDate >= frameStartDate) {
                    result.push(frame);
                }
                break;

            case RepeatPatternOption.weekdaysWest:
                if (targetDate >= frameStartDate
                    && dayOfWeek >= 1 && dayOfWeek <= 5) {
                    result.push(frame);
                }
                break;

            case RepeatPatternOption.weekdaysEast:
                if (targetDate >= frameStartDate && dayOfWeek >= 0 && dayOfWeek <= 4) {
                    result.push(frame);
                }
                break;

            case RepeatPatternOption.weekly: {
                const frameWeekDay = frameStartDate.getDay();
                const sameWeekday = dayOfWeek === frameWeekDay;
                const afterStart = targetDate >= frameStartDate;
                const inPerspective = targetDate <= perspectiveEnd;

                if (sameWeekday && afterStart && inPerspective) {
                    result.push(frame);
                }
                break;
            }

            case RepeatPatternOption.monthly: {
                const frameDayOfMonth = frameStartDate.getDate();
                const sameDayOfMonth = targetDate.getDate() === frameDayOfMonth;
                const afterStart = targetDate >= frameStartDate;
                const inPerspective = targetDate <= perspectiveEnd;

                if (sameDayOfMonth && afterStart && inPerspective) {
                    result.push(frame);
                }
                break;
            }

            case RepeatPatternOption.custom:
                if (targetDate >= frameStartDate && frame.customPattern?.weekDays?.includes(dayOfWeek)) {
                    result.push(frame);
                }
                break;
        }

        }
        return result.sort((a, b) => a.startTime.toString().localeCompare(b.startTime.toString()));
    }

    loadScheduledMeetings(currentDate: Date, scheduledMeetings: Meeting[]): CalendarDay[] {
        const calendarDays: CalendarDay[] = this.calendarUtils.getCalendarDays(currentDate);

        for (const day of calendarDays) {
            day.meetings = this.getMeetingsForDay(day.date, scheduledMeetings);
        }

        return calendarDays;
    }

    getMeetingsForDay(dayDate: Date, scheduledMeetings: Meeting[]): Meeting[] {
        const result: Meeting[] = [];

        const targetDate = new Date(dayDate);
        targetDate.setHours(0, 0, 0, 0);

        for (const meeting of scheduledMeetings) {
            if (!meeting.startTime) continue;

            const meetingStart = new Date(meeting.startTime);
            meetingStart.setHours(0, 0, 0, 0);

            if (meetingStart.getTime() === targetDate.getTime()) {
            result.push(meeting);
            }
        }

        return result.sort(
            (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    }

    getMeetingLink(meeting: Meeting): string | null {
        const links = [
            meeting.meetingLinkEvryka,
            meeting.meetingLinkGoogleMeets?.hangoutLink,
            meeting.meetingLinkTeams?.joinUrl,
            meeting.meetingLinkZoom?.join_url,
        ];

        return links.find(link => !!link && link.trim() !== '') || null;
    }

    hasAvailability(date: Date): boolean {
        const schedule = this.getSchedule();
        return schedule.some(
            (day) => this.isSameDay(new Date(day.date), date) && day.isAvailable && day.timeFrames.length > 0,
        )
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        )
    }
}
