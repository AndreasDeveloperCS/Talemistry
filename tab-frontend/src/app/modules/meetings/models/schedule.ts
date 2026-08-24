import { BaseEntity } from "../../general/models/base-entity";
import { TimeSpan } from "../../general/models/time-span";

export enum Weekday {
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday
}
export enum TimeSlotStatus {
    outOfAvailableSchedule,
    free,
    requested,
    tentative,
    busy
}

export enum SlotPeriod {
    quater = '15 min',
    half = '30 min',
    threeQauters = '45 min',
    hour= '1 hour',
    twoHour= '2 hour',
    custom = 'custom'
}
export class TimeSlot {
    startTime:Date = new Date();
    duration:TimeSpan = new TimeSpan();
    selectedSlotPeriod?:SlotPeriod = SlotPeriod.half;
    endTime:Date = new Date();
    isSelected:boolean = false;
}

export interface AvailabilityTimeFrame {
    startTime:Date;
    // duration:TimeSpan;
    slots:TimeSlot[];
    endTime:Date;
    sourceUtcStart?: any;
    sourceUtcEnd?: any;
}

export interface DateSchedule { 
    id:any;
    currentDate:Date;
    availableTimeFrames:AvailabilityTimeFrame[];
}
export interface BufferTime { 
    beforeTime:Date;
    afterTime:Date;
}


export interface IScheduleSettings extends BaseEntity{
    userId:any;

    defaultSlotPeriod:SlotPeriod;
    defaultCustomDuration:SlotPeriod;

    availableSlotPeriods:SlotPeriod[];

    availabeWeekDays:Weekday[];
    availableTimeFrames:AvailabilityTimeFrame[];

    startDate:Date;
    isUnlimited:boolean;
    endDate:Date;
    defaultSchedulePeriodAvailability:TimeSpan;
    // defaultTimeZone:TimeZone;
    bufferTime:BufferTime;
    allowInvitersAddGuests:boolean;
}

export interface IAvailableSchedule extends BaseEntity{
    userId:any;
    availableSlots:Map<Date, AvailabilityTimeFrame[]>;
}

export class AvailableSchedule implements BaseEntity{
    _id?: any;

    userId:any;
    availableSlots:Map<Date, AvailabilityTimeFrame[]> = new Map<Date, AvailabilityTimeFrame[]>();

    createdDate?: Date;
    modifiedDate?: Date;
}

export class ScheduleSettings implements IScheduleSettings{
    userId:any;

    defaultSlotPeriod:SlotPeriod = SlotPeriod.quater;
    defaultCustomDuration:SlotPeriod = SlotPeriod.custom;

    availableSlotPeriods:SlotPeriod[] = [];

    availabeWeekDays:Weekday[] = [];
    availableTimeFrames:AvailabilityTimeFrame[] = [];

    startDate:Date = new Date();
    isUnlimited:boolean = true;
    endDate:Date  = new Date();
    defaultSchedulePeriodAvailability:TimeSpan = new TimeSpan(1209600000);
    // defaultTimeZone:TimeZone;
    bufferTime:BufferTime = {beforeTime:new Date(), afterTime:new Date()};
    allowInvitersAddGuests:boolean = true;
}