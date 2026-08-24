import { TimeSpan } from "../../general/models/time-span";

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