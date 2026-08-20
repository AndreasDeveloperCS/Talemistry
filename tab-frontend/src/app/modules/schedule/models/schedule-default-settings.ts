import { BaseEntity } from "../../general/models/base-entity";
import { TimeSpan } from "../../general/models/time-span";
import { BufferTime, SlotPeriod, Weekday } from "../../meetings/models/schedule";
import { TimeFrame } from "./scheduled-meeting";

export enum SlotDuration {
    quater = '15 min',
    half = '30 min',
    threeQaurters = '45 min',
    hour = '1 hour',
    //ninety = '90 min',
    two = '2 hour',
    custom = 'custom'
}

export enum PlanningPerspectiveOption {
    day = 'Daily',
    week = 'Weekly',
    fortnight = 'Fortnightly',
    month = 'Monthly',
    quarter = 'Quarterly',
    year = 'Yearly',
    custom = 'Custom'
}

export class RepeatingPattern {
    customDays?: Weekday[] = [];
    startTime?: Date; // For custom patterns
    endTime?: Date; // For custom patterns
    type: 'none' | 'daily' | 'weekdays-west' | 'weekdays-east' | 'weekly' | 'fortnight' | 'monthly' | 'custom' = 'none';
    repeatInterval?: number;
    repeatCount?: number = 0;
    isInfinite: boolean = true;
    isActive: boolean = true;
    startDate?: Date;
}

export class ScheduleDefaultSettings implements BaseEntity {

    _id?: any;
    userId: any;
    autoAcception: boolean = true;
    autoExtension: boolean = true;

    defaultSlotDurationOption: SlotPeriod = SlotPeriod.half; // Default time frame for calendar availability
    defaultMeetingDuration: number = new TimeSpan(1800000).milliseconds; // Default time frame for calendar availability

    defaultPlanningPerspectiveOption: PlanningPerspectiveOption = PlanningPerspectiveOption.fortnight; // Default time frame for calendar availability
    defaultPlanningPerspective: number = new TimeSpan(604800000).milliseconds; // Default time frame for calendar availability

    publicCalendarLink!: string;
    availableTimeFrames: TimeFrame[] = [];

    bufferTime?: BufferTime;
    calendarTimeZone?: string;

    createdBy?: any;
    createdDate?: Date;
    modifiedBy?: any;
    modifiedDate?: Date;
}