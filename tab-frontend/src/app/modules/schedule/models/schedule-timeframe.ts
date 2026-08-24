import { BaseEntity } from "../../general/models/base-entity";
export interface TimeFrame {
    startTime: Date;
    endTime: Date;
}
export class ScheduleTimeFrame implements BaseEntity {
    _id?: any;
    userId: any;
    startTime: Date = new Date();
    endTime!: Date;
    availableTimeFrames?: TimeFrame[]; // This can be an array of time frames or any other structure as needed
    busyTimeFrames?: TimeFrame[]; // This can be an array of time frames or any other structure as needed
    createdBy: any;
    createdDate!: Date;
    modifiedBy?: any;
    modifiedDate?: Date;
}

