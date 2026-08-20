import { Injectable } from '@angular/core';
import { gapi } from 'gapi-script';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GoogleApiService {
  private CLIENT_ID = environment.socialLogin.GOOGLE.CLIENT_ID;
  private API_KEY = environment.socialLogin.GOOGLE.API_KEY;
  private SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

  constructor() {

  }

  private initClient() {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: this.API_KEY,
        clientId: this.CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: this.SCOPES,
      });
    });
  }

  signIn() {
    return gapi.auth2.getAuthInstance().signIn();
  }

  createGoogleMeeting(): Promise<any> {
    return gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: 'Google Meeting',
        description: 'Meeting created via Angular',
        start: {
          dateTime: new Date().toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
          timeZone: 'UTC',
        },
        conferenceData: {
          createRequest: { requestId: 'sample123', conferenceSolutionKey: { type: 'hangoutsMeet' } },
        },
      },
      conferenceDataVersion: 1,
    });
  }


}
