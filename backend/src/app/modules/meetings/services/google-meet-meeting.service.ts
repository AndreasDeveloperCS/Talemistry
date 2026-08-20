import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
const { authenticate } = require('@google-cloud/local-auth');

import * as fs from 'fs';
import * as path from 'path';
import { cwd } from 'process';
import { getBaseDir } from '../../../common/utils/path.helper';

@Injectable()
export class GoogleMeetMeetingService {
  private readonly fileName = "google.api.calendar-461909-v3-70dee0837e58.json";
  private readonly scopes = ['https://www.googleapis.com/auth/calendar'];
  private readonly profileEmail = process.env.GOOGLE_PROFILE_EMAIL;

  private async getJWTClient(): Promise<any> {
    const baseDir = getBaseDir();
    const keyPath = path.join(
      baseDir,
      'google.api.calendar-461909-v3-70dee0837e58.json'
    );
    // const keyPath = path.join(getBaseDir('getJWTClient'), this.fileName);
    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    console.log(keyPath);

    const jwtClient = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: this.scopes,
      subject: this.profileEmail,
    });

    return jwtClient;
  }

  public async createMeeting(summary: string, startTime: any, endTime: any, attendees: any[]): Promise<any | string> {

    const jwtClient = await this.getJWTClient();
    await jwtClient.authorize();
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    const event = {
      summary,
      start: {
        dateTime: startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime,
        timeZone: 'UTC',
      },
      attendees: attendees.map((participant) => ({
        email: participant.email,
        responseStatus: 'needsAction' // Optional: defaults to this
      })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`, // unique for idempotency
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
    };
    console.log('Google Meet Event:', event);

    const response = await calendar.events.insert({
      calendarId: 'primary', // or a specific calendar id
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return response.data || 'No Meet link generated';
  }
}
