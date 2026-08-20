import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Request, Response } from 'express';
import { ROLES } from '../../../common/enums';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { TimeSpan } from '../../base/models/time-span';
import { VideoChatRoom, VideoChatRoomType } from '../../communication/models/video-chat-room';
import { VideoChatRoomService } from '../../communication/services/video-chat-room.service';
import { EmailService, getGmtLabel } from '../../email/services/email.service';
import { User } from '../../users/models/user';
import { UsersService } from '../../users/services/user.service';
import { VerificationService } from '../../users/services/verification.service';
import { GoogleMeet } from '../model/google-meet';
import { Meeting } from '../model/meeting';
import { MeetingLinks } from '../model/meeting-links';
import { TimeSlot } from '../model/schedule-settings';
import { TeamsMeeting } from '../model/teams';
import { ZoomMeeting } from '../model/zoom';
import { CalendarService } from '../services/calendar.service';
import { GoogleMeetMeetingService } from '../services/google-meet-meeting.service';
import { MeetingsService } from '../services/meetings.service';
import { TeamsService } from '../services/team.service';
import { ZoomService } from '../services/zoom.service';

@Controller('meetings')
@SetMetadata('entityModel', Meeting)
export class MeetingsController extends BaseController<Meeting> {
    override className: string = this.constructor.name;

    constructor(protected service: MeetingsService,
        private calendarService: CalendarService,
        private emailService: EmailService,
        private userService: UsersService,
        private verificationService: VerificationService,
        private googleMeetMeetingService: GoogleMeetMeetingService,
        private videoChatRoomsService: VideoChatRoomService,
        private zoomMeeting: ZoomService,
        private teamsMeeting: TeamsService,
        protected moduleRef: ModuleRef) {
        super(service, moduleRef);
    }

    @Get()
    async getAllAsync(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    }

    @Get('by-range')
    async getMonthRangeMeetingsAsync(
        @Query('startDate') startDate: any,
        @Query('endDate') endDate: any,
        @Req() request: Request,
        @Res() response: Response
        ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get('by-range')", startDate, endDate);

        try {
            const start = new Date(startDate);
            start.setDate(start.getDate() - 1);
            const end = new Date(endDate);

            const requestingUser: User = this.utilitiesService?.getUser(request); 
            const meetings = await this.service.getMeetingsByRangeAsync(requestingUser.email, start, end);
            console.log('meetings', meetings);
            if (!meetings) {
                return response.status(200).json(null); 
            }
            return response.status(200).json(meetings);
        } catch (error) {
            console.error('Error fetching meetings by email:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get('selected-date')
    async getBySelectedDateAsync(
        @Query('selectedDate') selectedDate: any,
        @Req() request: Request,
        @Res() response: Response
        ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get('selected-date')", selectedDate);

        try {
            const date = new Date(selectedDate);
            const requestingUser: User = this.utilitiesService?.getUser(request); 
            const meetings = await this.service.getMeetingsByDateAsync(requestingUser.email, date);
            console.log('meetings By Selected Date', meetings);
            return response.status(200).json(meetings);
        } catch (error) {
            console.error('Error fetching meetings by email and date:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get(':_id')", _id);

        try {
            const meeting = await this.service.getByIdAsync(_id);
            console.log('Meeting', meeting);
            return response.status(200).json(meeting);
        } catch (error) {
            console.error('Error fetching meeting by ID:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Post()
    @HttpCode(201)
    async post(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const meeting: Meeting = body;
            // 1️⃣ convert UTC → meeting timezone (for display only)
            const meetingTz = meeting.timeZone; 
            const startInTz = toZonedTime(meeting.startTime, meetingTz);
            const endInTz = toZonedTime(meeting.endTime, meetingTz);
        
            // 2️⃣ format date & time
            const formattedStartTime = format(startInTz, 'MMMM d, yyyy, HH:mm');
            const formattedEndTime = format(endInTz, 'MMMM d, yyyy, HH:mm');
        
            // 3️⃣ compute GMT offset (⚠️ use UTC date!)
            const gmtLabel = getGmtLabel(meetingTz, meeting.startTime);
        
            // 4️⃣ final labels
            const startLabel = `${formattedStartTime} (${meetingTz}, ${gmtLabel})`;
            const endLabel = `${formattedEndTime} (${meetingTz}, ${gmtLabel})`;

            meeting.meetingLinks = meeting.meetingLinks != null && meeting.meetingLinks != undefined ? meeting.meetingLinks : new MeetingLinks();
            let requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                requestingUser = await this.userService?.findByEmail(meeting.participants[0].email);
            }

            if (!requestingUser) {
                requestingUser = await this.userService.createUser(
                    meeting.participants[0].firstname,
                    meeting.participants[0].lastname,
                    meeting.participants[0].email,
                    'N/A', [ROLES.CONTACT]
                );
                this.verificationService.createEmailVerificationRequest(requestingUser);
            }

            meeting.userId = body.userId ? body.userId : requestingUser._id;
            meeting.createdBy = new ObjectId(requestingUser._id);
            // console.log('Meeting Controller Body', body);
            console.log('Meeting Controller meeting', meeting);

            const event = this.calendarService.getEvent(meeting);

            console.log(`event RESULT`, event);

            console.log(`meeting`, meeting);

            if (meeting.meetingLinkEvryka !== '') {
                const videoChatRoom: VideoChatRoom = {
                    type: meeting.participants.length > 2 ? VideoChatRoomType.GROUP : VideoChatRoomType.DIRECT,
                    participants: meeting.participants.map(p => ({
                        name: `${p.firstname} ${p.lastname}`,
                        email: p.email,
                    })),
                    name: meeting.topic,
                    isVerified: true,
                    isOpenMeeting: true,
                    userId: new ObjectId(requestingUser._id),
                    createdBy: new ObjectId(requestingUser._id),
                    createdDate: new Date(),
                }
                const createdRoom = await this.videoChatRoomsService.createAsync(videoChatRoom);
                console.log(`created Video ChatRoom`, createdRoom);
                meeting.meetingLinkEvryka = `${meeting.meetingLinkEvryka}/${createdRoom._id}`;
                event.description = `<br><br><strong>📍 You are invited to a Evryka meeting.</strong>
                    <br><br>📌 Topic: ${meeting.topic}
                    <br>🕒 Time: ${startLabel} 
                    <br>🔗 Join Evryka Meeting:\n${meeting.meetingLinkEvryka}`;
            }

            if (meeting.meetingLinkZoom.join_url !== '' && meeting.meetingLinkZoom.join_url !== undefined) {
                try {
                    // Zoom:
                    console.log(`zoom 1`);
                    const response = await this.zoomMeeting.createMeeting(event);
                    console.log(`zoom 1 RESULT`, response);
                    const zoomMeeting: ZoomMeeting = {
                        id: response.id,
                        topic: response.topic,
                        start_time: response.start_time,
                        duration: response.duration,
                        timezone: response.timezone,
                        start_url: response.start_url,
                        join_url: response.join_url,
                        password: response.password
                    };
                    meeting.meetingLinkZoom = zoomMeeting;
                    console.log(`zoom 1`, meeting.meetingLinkZoom);

                    event.description += `<br><br><strong>📍 You are invited to a Zoom meeting.</strong>
                        <br><br>📌 Topic: ${meeting.topic}
                        <br>🕒 Time: ${startLabel}
                        <br>🔗 Join Zoom Meeting:\n${meeting.meetingLinkZoom.join_url}
                        <br>🆔 Meeting ID: ${meeting.meetingLinkZoom.id}
                        <br>🔐 Passcode: ${meeting.meetingLinkZoom.password ?? 'N/A'}<br/>`;

                } catch (ex) {
                    console.error(`ZOOM EX`, ex);
                }
            }

            if (meeting.meetingLinkTeams.joinUrl !== '' && meeting.meetingLinkTeams.joinUrl !== undefined) {
                try {
                    // Teams: 
                    console.log(`TEAMS`);
                    const response = await this.teamsMeeting.createMeetingAsync(meeting);
                    console.log(`TEAMS RESULT`, response, response.participants);
                    const teamsMeeting: TeamsMeeting = {
                        id: response.id,
                        subject: response.subject,
                        startDateTime: response.startDateTime,
                        endDateTime: response.endDateTime,
                        joinUrl: response.joinUrl,
                        joinWebUrl: response.joinWebUrl,
                        meetingCode: response.meetingCode
                    };
                    meeting.meetingLinkTeams = teamsMeeting;
                    console.log(`TEAMS`, meeting.meetingLinkTeams);

                    event.description += `<br><br><strong>📍 You are invited to a Teams meeting.</strong>
                        <br><br>📌 Topic: ${meeting.meetingLinkTeams.subject}
                        <br>🕒 Time: ${startLabel}
                        <br>🔗 Join Teams Meeting:\n${meeting.meetingLinkTeams.joinUrl}
                        <br>🆔 Meeting Code: ${meeting.meetingLinkTeams.meetingCode}`;

                } catch (ex) {
                    console.error(`TEAMS EX`, ex);
                }
            }

            if (meeting.meetingLinkGoogleMeets.hangoutLink !== '' && meeting.meetingLinkGoogleMeets.hangoutLink !== undefined) {
                try {
                    // Google Meet:
                    console.log(`GOOGLE MEET`);
                    const response = await this.googleMeetMeetingService.createMeeting(meeting.topic, meeting.startTime, meeting.endTime, meeting.participants);
                    console.log(`google meet event`, response);

                    const googleMeeting: GoogleMeet = {
                        id: response.id,
                        summary: response.summary,
                        start: response.start,
                        end: response.end,
                        hangoutLink: response.hangoutLink,
                    }
                    meeting.meetingLinkGoogleMeets = googleMeeting;
                    console.log(`google meet`, meeting.meetingLinkGoogleMeets);

                    event.description += `<br><br><strong>📍 You are invited to a Google Meet meeting.</strong>
                        <br><br>📌 Topic: ${meeting.meetingLinkGoogleMeets.summary}
                        <br>🕒 Time: ${startLabel}
                        <br>🔗 Join Google Meet Meeting:\n${meeting.meetingLinkGoogleMeets.hangoutLink}`;
                } catch (ex) {
                    console.error(`GOOGLE MEET EX`, ex);
                }
            }

            try {
                meeting.meetingLinks.ics = this.calendarService.generateIcsCalendarLink(event);
            } catch (ex) {
                console.error(`ex`, ex);
            }

            try {
                meeting.meetingLinks.google = this.calendarService.generateGoogleCalendarLink(event);
            } catch (ex) {
                console.error(`ex`, ex);
            }
            try {
                meeting.meetingLinks.office365 = this.calendarService.generateOffice365CalendarLink(event);
            } catch (ex) {
                console.error(`ex`, ex);
            }

            try {
                meeting.meetingLinks.outlook = this.calendarService.generateOutlookCalendarLink(event);
            } catch (ex) {
                console.error(`ex`, ex);
            }

            try {
                meeting.meetingLinks.yahoo = this.calendarService.generateYahooCalendarLink(event);
            } catch (ex) {
                console.error(`ex`, ex);
            }

            Object.setPrototypeOf(meeting, Meeting.prototype);
            Object.setPrototypeOf(meeting.timeSlot, TimeSlot.prototype);
            Object.setPrototypeOf(meeting.timeSlot.duration, TimeSpan.prototype);
            Object.setPrototypeOf(meeting.duration, TimeSpan.prototype);

            console.log('Meeting Controller meeting', meeting);
            // const result = await this.service.getByUserIdAsync(this.utilitiesService.getUser(request)._id);
            // console.log('Meeting Controller meetings by userId', result);

            this.emailService.sendMeetingInvite(meeting);

            return await super.postAsync(meeting, request, response, ip);
        } catch (error) {
            return response.status(500).send(error);
        }
    }

    @Put()
    @HttpCode(204)
    async putPayload(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        return await super.putAsync(body, request, response, ip);
    }

    @Put(':id')
    @HttpCode(204)
    async put(
        @Param('id') id: string,
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        return await super.putAsync(body, request, response, ip);
    }

    @Patch(':_id')
    async patch(
        @Param('_id') _id: string,
        @Query('propertyName') propertyName: string,
        @Body() body: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.patchAsync(_id, propertyName, body, request, response);
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.deleteAsync(id, request, response);
    }
}
