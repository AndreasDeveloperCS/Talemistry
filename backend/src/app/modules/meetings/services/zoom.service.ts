import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class ZoomService {
    private readonly clientId = process.env.ZOOM_CLIENT_ID;
    private readonly clientSecret = process.env.ZOOM_CLIENT_SECRET;
    private readonly accountId = process.env.ZOOM_ACCOUNT_ID;
    private readonly hostEmail = process.env.HOST_MAIL;

    private accessToken: string;
    private tokenExpiresAt: number;

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        const res = await axios.post(
            'https://zoom.us/oauth/token',
            `grant_type=account_credentials&account_id=${this.accountId}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                auth: {
                    username: this.clientId,
                    password: this.clientSecret,
                },
            },
        );

        this.accessToken = res.data.access_token;
        this.tokenExpiresAt = Date.now() + res.data.expires_in * 1000 - 10000;

        return this.accessToken;
    }

    async createMeeting(event: any) {
        //console.log('zoom createMeeting', event, event.start);
        try {
            const token = await this.getAccessToken();
            //console.log('zoom token', token);

            const res = await axios.post(
                `https://api.zoom.us/v2/users/${this.hostEmail}/meetings`,
                {
                    topic: event.title,
                    type: 2, // Scheduled meeting with fixed time
                    start_time: event.start,
                    duration: event.duration.totalMilliseconds / 60000,
                    timezone: 'UTC',
                    settings: {
                        registrants_email_notification: true,
                        waiting_room: false,
                        participant_video: true,
                        join_before_host: true,
                        approval_type: 2,
                        //registration_type: 1,
                        enforce_login: false,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            //console.log('Zoom data', res.data);
            return res.data;
        } catch (ex) {
            console.error('zoom createMeeting error', ex);
        }
    }

    // async createMeeting1(hostEmail: string, topic: string, startTime: string) {
    //     const token = await this.getAccessToken();

    //     const res = await axios.post(
    //         `https://api.zoom.us/v2/users/${hostEmail}/meetings`,
    //         {
    //             topic,
    //             type: 2, // Scheduled meeting
    //             start_time: startTime,
    //             duration: 30,
    //             timezone: 'UTC',
    //             settings: {
    //                 registrants_email_notification: true,
    //                 waiting_room: false,
    //                 participant_video: true,
    //                 approval_type: 2, // → ✅ auto-approve
    //                 //registration_type: 1, //→ 🔁 register once for all meetings in the series (irrelevant for type 2 one-time meetings)
    //                 join_before_host: true, //→ ✅ good
    //                 enforce_login: false, //→ ✅ anyone with link can join
    //             },
    //         },
    //         {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': 'application/json',
    //             },
    //         },
    //     );
    //     console.log('Zoom data', res.data);
    //     return res.data;
    // }
}