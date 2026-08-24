import { Meeting } from "../../meetings/models/meeting";
import { TimeFrame } from "./scheduled-meeting"

// export interface Meeting {
//   id: string
//   title: string
//   description?: string
//   startTime: Date
//   endTime: Date
//   attendees: string[]
//   type: "interview" | "screening" | "team-meeting" | "other"
//   candidate?: string
//   position?: string
//   interviewer: string
//   location?: string
//   isVirtual: boolean
//   meetingLink?: string
// }

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  meetings: Meeting[];
  timeFrames: TimeFrame[];
  hasViewerAvailability?: boolean;
}

export interface TimeSlot {
  time: string;
  label: string;
  isAvailable: boolean;
  meetings: Meeting[];
}

export type CalendarView = "month" | "week" | "day"

export interface MeetingView extends Meeting {
  viewerStartTime: Date; // startTime converted to current user timezone
  viewerEndTime: Date;   // endTime converted to current user timezone
  originalTimeStr?: string; // optional display of original start/end in meeting timezone
}