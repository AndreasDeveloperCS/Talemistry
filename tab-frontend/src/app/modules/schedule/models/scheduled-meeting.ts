import { Guid } from "guid-typescript"

export interface Meeting {
    id: string
    title: string
    description?: string
    startTime: Date
    endTime: Date
    attendees: string[]
    type: "interview" | "screening" | "team-meeting" | "other"
    candidate?: string
    position?: string
    interviewer: string
    location?: string
    isVirtual: boolean
    meetingLink?: string
}

export interface CalendarDay {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    meetings: Meeting[]
}

export interface TimeSlot {
    startTime: Date;
    endTime: Date;
    label: string
    isAvailable: boolean
    meetings: Meeting[]
}

export type CalendarView = "month" | "week" | "day"

// export type RepeatPattern = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "custom"
export enum RepeatPatternOption {
    none = 'none',
    daily = 'daily',
    weekdaysWest = 'weekdays-west',
    weekdaysEast = 'weekdays-east',
    weekly = 'weekly',
    fortnightly = 'fortnightly',
    monthly = 'monthly',
    custom = 'custom'
}

// export type PlanningPerspective = "week" | "month" | "fortnight" | "quarter" | "year" | "custom"

export interface TimeFrame {
    id: string | Guid | any;
    startTime: any;
    endTime: any;
    repeatPattern: RepeatPatternOption;
    customPattern?: {
        dates?: number[]
        weekDays?: number[]
        weeks?: number[]
        months?: number[]
    }
    startDate?: Date;
}

export interface ScheduleDay {
    date: Date
    timeFrames: TimeFrame[]
    isAvailable: boolean
}

export interface UserSchedule {
    userId: string
    availableDays: ScheduleDay[]
}
