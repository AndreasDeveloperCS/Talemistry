import { BaseEntity } from "../../general/models/base-entity";
import { MeetingPlatfrom, ParticipantInfo } from "../../meetings/models/meeting";
import { SlotDuration } from "../../schedule/models/schedule-default-settings";

export class MeetingTemplate implements BaseEntity {
    _id?: any;
    positionId: any;
    userId: any; // recruiter who created the template
    topic: string = '';
    agenda: string = '';
    expiresAt?: Date;
    startDate: Date = new Date();
    endDate?: Date = new Date();
    timeZone?: string;
    participants?: ParticipantInfo[] = [];
    platform: MeetingPlatfrom = MeetingPlatfrom.EVRYKA;
    selectedSlotPeriod: SlotDuration = SlotDuration.half;
    createdBy: any;
    createdDate?: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}