import { NotificationTemplate } from "../enums/notification-templates.enum";

export interface WhatsAppNotificationPayload {
  template: NotificationTemplate;
  user: {
    phone: string;
    firstName: string;
  };
  data: {
    positionId?: string;
    companyName?: string;
    positionName?: string;
    calendarLinkId?: string;
    screeningLinkId?: string;
    joinInterviewLink?: string;
    feedbackLink?: string;
    timeSlot?: string;
    callerName?: string;
    callType?: string;
    roomName?: string;
    directCallLink?: string;
  };
}