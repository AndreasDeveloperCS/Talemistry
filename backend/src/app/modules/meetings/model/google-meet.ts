export class GoogleMeet {
    id: any;
    summary: string;
    start: MeetingTime;
    end: MeetingTime;
    hangoutLink: string;
}

export class MeetingTime {
    dateTime: any;
    timeZone: string;
}