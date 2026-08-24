import { Injectable } from '@nestjs/common';
import { google, ics, office365, outlook, yahoo } from 'calendar-link';
import { Meeting } from '../model/meeting';


@Injectable()
export class CalendarService {

  constructor() {
  }
  getEvent(meeting: Meeting): any {
    if (!meeting) {
      return null;
    }
    console.log('meeting', meeting);
    const attendees = (meeting.participants || [])
      .filter(participant => participant && participant.email)
      .map(participant => {
        return { "email": participant.email }
      });
    console.log('meeting attendees', attendees);
    const startTime = meeting.timeSlot?.startTime;
    const endTime = meeting.timeSlot?.endTime;
    const duration = meeting.timeSlot?.duration;
    const timeZone = meeting.timeSlot?.timeZone;

    console.log('startTime', meeting.timeSlot);
    if (!startTime || !endTime || !duration) {
      return null;
    }
    // start: {
    //   dateTime: new Date(meeting.timeSlot.startTime).toISOString(),
    //   //timeZone: timeZone ?? `UTC`,
    // },
    // end: {
    //   dateTime: new Date(meeting.timeSlot.endTime).toISOString(),
    //   //timeZone: timeZone ?? `UTC`,
    // },
    console.log('getEvent', meeting.timeSlot);
    const event: any = {
      summary: meeting.topic,
      title: meeting.topic || '',
      description: `${meeting.agenda || ''}\n${meeting.meetingLinkEvryka || ''}`,
      duration: meeting.duration,
      start: startTime,
      end: endTime,
      location: meeting.meetingLinkEvryka || '',
      attendees: attendees,
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1 },
          { method: 'popup', minutes: 1 }
        ]
      },
      conferenceDataVersion: 1,
    };
    console.log('getEvent ENTITY ', event);

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
