import { ZoomService } from "../services/zoom.service";
import { Controller, Get, Query } from '@nestjs/common';


@Controller('zoom')
export class ZoomController {
    constructor(private readonly zoomService: ZoomService) { }

    @Get('create-meeting')
    async createMeeting(@Query() query) {
        // const meeting = await this.zoomService.createMeeting1(
        //     query.hostEmail,
        //     query.topic,
        //     new Date(Date.now() + 3600000).toISOString() // e.g., 1 hour from now
        // );
        // return {
        //     joinUrl: meeting.join_url,
        //     meetingId: meeting.id,
        //     password: meeting.password,
        // };
    }
}