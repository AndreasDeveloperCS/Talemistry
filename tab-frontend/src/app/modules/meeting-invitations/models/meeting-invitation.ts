import { BaseEntity } from "../../general/models/base-entity";
import { MeetingPlatfrom, ParticipantInfo } from "../../meetings/models/meeting";
import { SlotDuration } from "../../schedule/models/schedule-default-settings";

export enum InvitationStatus {
  draft,
  sent,
  viewed,
  booked,
  expired,
  cancelled
}

export class MeetingInvitation implements BaseEntity {
  _id?: any;

  positionId!: any;                     
  recruiterId!: any;   
  userId: any;  
  talentId!: any;
  templateId?: any;               

  topic: string = '';                   
  agenda?: string;
  meetingId?: any; 
  bookingToken: string = '';                
  platform: MeetingPlatfrom = MeetingPlatfrom.GOOGLE_MEET;                 

  startDate!: Date;                     
  endDate!: Date;      
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;                 
  selectedSlotPeriod: SlotDuration = SlotDuration.quater;         

  participants: ParticipantInfo[] = []; 
  status: InvitationStatus = InvitationStatus.draft; 
  createdBy: any;
  createdDate: Date = new Date();
}