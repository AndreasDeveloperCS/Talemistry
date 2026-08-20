import { TimeSpan } from "../../base/models/time-span";

export enum SlotStatus {
    busy,
    tentetive,
    available
}

export interface Slots {
    startDate:Date;
    duration:TimeSpan;
    timeZone?:any;
    slotStatus:SlotStatus;
}