import { Injectable } from '@angular/core';
import { google, outlook, ics, yahoo, office365 } from 'calendar-link';
import { Meeting } from '../models/meeting';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
     
  getEvent(meeting: Meeting):any {
    const event = {
      title: meeting.topic,
      description: meeting.agenda,
      start: meeting.timeSlot.startTime,
      duration: [meeting.timeSlot.duration.minutes, 'minute'],
      location: meeting.meetingLinkEvryka,
    };
    return event;
  }
  
  generateGoogleCalendarLink(event: any): string {
    return google(event);
  }

  generateOffice365CalendarLink(event: any): string {
    return office365(event);
  }

  generateOutlookCalendarLink(event: any): string {
    return outlook(event);
  }

  generateIcsCalendarLink(event: any): string {
    return ics(event);
  }

  generateYahooCalendarLink(event: any): string {
    return yahoo(event);
  }

  
}