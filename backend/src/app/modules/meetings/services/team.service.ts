import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Meeting } from '../model/meeting';
const msal = require('@azure/msal-node');
import axios from 'axios';

@Injectable()
export class TeamsService {
    private readonly clientId = process.env.MS_CLIENT_ID;
    private readonly clientSecretValue = process.env.MS_CLIENT_SECRET_VALUE; 
    private readonly tenantId = process.env.MS_TENANT_ID;
    private readonly userId = process.env.MS_USER_ID; 

    constructor(
        private readonly httpService: HttpService) {
    }

    private async getAccessToken1(): Promise<string> {
        const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

        const body2 = new URLSearchParams({
            client_id: this.clientId,
            scope: 'https://graph.microsoft.com/.default ',
            client_secret: this.clientSecretValue,
            grant_type: 'client_credentials',
        });
        try {
            const response = await firstValueFrom(this.httpService.post(url, body2, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }));

            const apiresponse = response.data.access_token;
            console.log('TEAMS TOKEN 2', apiresponse);
            return apiresponse;
        } catch (ex) {
            console.error('TEAMS TOKEN 2 getAccessToken ex', ex);
        }
    }

    async createMeetingAsync(meeting: Meeting) {
        const accessToken = await this.getAccessToken1();

        const attendees = meeting.participants.map(participant => ({
            upn: participant.email, 
            role: 'attendee',
        }));

        try {
            const response = await axios.post(
                `https://graph.microsoft.com/v1.0/users/${this.userId}/onlineMeetings`,
                {
                    subject: meeting.topic,
                    startDateTime: meeting.startTime,
                    endDateTime: meeting.endTime,
                    lobbyBypassSettings: {
                        scope: "everyone",
                        isDialInBypassEnabled: true
                    },
                    allowMeetingChat: "enabled",
                    isEntryExitAnnounced: true,
                    allowedPresenters: "everyone",

                    participants: {
                        attendees: attendees,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('1 Failed to create meeting:', error.response.status, error.response.data);
        }
    }

    async getUserLicenseDetails(accessToken: string, userId: string): Promise<any> {
        try {
            const response = await axios.get(
                `https://graph.microsoft.com/v1.0/users/${this.userId}/licenseDetails`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error('Failed to fetch license details:', error.response?.data || error.message);
        }
    }

    async listUsers(accessToken: string): Promise<any> {
        try {
            const response = await axios.get('https://graph.microsoft.com/v1.0/users', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log(response.data.value.map(user => user.userPrincipalName));

            return response.data.value;
        } catch (error) {
            console.error('Failed to fetch users list:', error.response?.data || error.message);
        }
    }

    private async getAccessToken2(): Promise<string> {
        try {
            const config = {
                auth: {
                    clientId: this.clientId,
                    authority: `https://login.microsoftonline.com/${this.tenantId}`,
                    clientSecret: this.clientSecretValue, // this.clientSecretValue,
                },
            };

            const cca = new msal.ConfidentialClientApplication(config);

            const clientCredentialRequest = {
                scopes: ["https://graph.microsoft.com/.default"],
            };
            const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
            console.log('TEAMS TOKEN 3', response);
            return response.accessToken;
        } catch (ex) {
            console.error('TEAMS TOKEN 3 getAccessToken ex', ex);
        }
    }
}