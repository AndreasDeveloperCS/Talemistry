import { ObjectId } from "bson";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { TimeSpan } from "../../base/models/time-span";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";

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

export class TimeSlot {
    date: Date;
    startTime: Date;
    duration: TimeSpan;
    endTime?: Date;
    timeZone?: any;
    isSelected: boolean;
}

export enum SlotDuration {
    quater = '15 min',
    half = '30 min',
    threeQaurters = '45 min',
    hour = '1 hour',
    ninety = '90 min',
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

export interface AvailabilityTimeFrame {
    startTime: Date;
    endTime: Date;
}

export interface DateSchedule {
    id: any;
    currentDate: Date;
    availableTimeFrames: AvailabilityTimeFrame[];
}

export class BufferTime {
    beforeTime: TimeSpan;
    afterTime: TimeSpan;

    constructor(beforeTime: TimeSpan = new TimeSpan(), afterTime: TimeSpan = new TimeSpan()) {
        this.beforeTime = beforeTime;
        this.afterTime = afterTime;
    }
}

export class RepeatingPattern {
    customDays?: Weekday[] = [];
    startTime?: Date;
    endTime?: Date;
    type: 'none' | 'daily' | 'weekdays-west' | 'weekdays-east' | 'weekly' | 'fortnight' | 'monthly' | 'custom';
    repeatInterval?: number;
    repeatCount?: number = 0;
    isInfinite: boolean = true;
    isActive: boolean = true;
    startDate: Date;
}

@Schema({ collection: 'schedule-settings' })
@Entity("schedule-settings")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class ScheduleDefaultSettings implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    autoAcception: boolean = true;

    @Column()
    @Prop({ required: true })
    autoExtension: boolean = true;

    @Column()
    @Prop({ required: true, type: () => TimeSpan, default: new TimeSpan(604800000) })
    defaultPlanningPerspective: TimeSpan;

    @Column()
    @Prop({ required: true })
    defaultSlotDurationOption: SlotDuration = SlotDuration.half; // Default time frame for calendar availability

    @Column()
    @Prop({ required: true, type: () => TimeSpan, default: new TimeSpan(1800000) })
    defaultMeetingDuration: TimeSpan = new TimeSpan(1800000); // Default time frame for calendar availability

    @Column()
    @Prop({ required: true })
    defaultPlanningPerspectiveOption: PlanningPerspectiveOption = PlanningPerspectiveOption.fortnight; // Default time frame for calendar availability

    @Column()
    @Prop({ required: false })
    calendarTimeZone: string;

    @Column()
    @Prop({ required: true })
    publicCalendarLink!: string;

    @Column()
    @Prop({ required: true })
    availableTimeFrames: RepeatingPattern[];

    @Column()
    @Prop({ required: false, type: () => BufferTime, default: { beforeTime: new TimeSpan(0), afterTime: new TimeSpan(0) } })
    bufferTime: BufferTime;


    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date(Date.now());

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate?: Date;
}

export type ScheduleDefaultSettingsDocument = ScheduleDefaultSettings & Document;

export const ScheduleDefaultSettingsSchema = SchemaFactory.createForClass(ScheduleDefaultSettings);