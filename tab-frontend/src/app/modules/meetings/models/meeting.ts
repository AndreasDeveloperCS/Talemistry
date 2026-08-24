import { BaseEntity } from "../../general/models/base-entity";
import { TimeSpan } from "../../general/models/time-span";
import { SlotPeriod, TimeSlot } from "./schedule";

export enum MeetingPlatfrom {
  EVRYKA,
  GOOGLE_MEET,
  TEAMS,
  ZOOM
}
export interface ParticipantInfo {
    firstname:string;
    lastname:string;
    email:string;
}

export enum MeetingStatus {
    draft,
    requested,
    confirmed,
    cancelled,
    tentative,
}
export interface MeetingLinks {
    google:string;
    outlook:string;
    office365:string;
    ics:string;
    yahoo:string;
}
export class Meeting implements BaseEntity{
    _id: any;
    
    userId?:any;
    positionId?:any;
    invitationId?:any;

    participants:ParticipantInfo[] = [{
        firstname:'',
        lastname:'',
        email:''    
    }];

    topic:string = '';
    agenda:string= '';  

    timeSlot:TimeSlot = new TimeSlot();
    
    date:Date= new Date();
    startTime:Date= new Date();
    duration:TimeSpan = new TimeSpan();
    selectedSlotPeriod:SlotPeriod = SlotPeriod.quater;
    endTime:Date = new Date();
    timeZone?:any;
    
    meetingLinkEvryka:string = '';
    meetingLinkGoogleMeets: GoogleMeet = new GoogleMeet();
    meetingLinkTeams: TeamsMeeting = new TeamsMeeting();
    meetingLinkZoom: ZoomMeeting = new ZoomMeeting();

    status:MeetingStatus = MeetingStatus.draft;
    meetingLinks!:MeetingLinks;
    createdBy?:any;
    createdDate: Date = new Date();
    modifiedBy?:any;
    modifiedDate?: Date;
    platform?: MeetingPlatfrom;
}

export class ZoomMeeting {
    id?: any;
    topic?: string;
    start_time?: any;
    duration?: number;
    timezone?: 'UTC';
    start_url?: string;
    join_url?: string;
    password?: string;
}

export class TeamsMeeting {
    id?: any;
    subject?: string;
    startDateTime?: any;
    endDateTime?: any;
    joinUrl?: string;
    joinWebUrl?: string;
    meetingCode?: string;
}

export class GoogleMeet {
    id: any;
    summary?: string;
    start?: MeetingTime;
    end?: MeetingTime;
    hangoutLink?: string;
}

export class MeetingTime {
    dateTime?: any;
    timeZone?: string;
}

export const meetingPlatformLabels: Record<number, string> = {
  [MeetingPlatfrom.EVRYKA]: 'EVRYKA',
  [MeetingPlatfrom.GOOGLE_MEET]: 'Google Meet',
  [MeetingPlatfrom.TEAMS]: 'Microsoft Teams',
  [MeetingPlatfrom.ZOOM]: 'Zoom',
};

export const meetingStatusLabels: Record<number, string> = {
  [MeetingStatus.draft]: 'Draft',
  [MeetingStatus.requested]: 'Requested',
  [MeetingStatus.confirmed]: 'Confirmed',
  [MeetingStatus.cancelled]: 'Cancelled',
  [MeetingStatus.tentative]: 'Tentative',
};
