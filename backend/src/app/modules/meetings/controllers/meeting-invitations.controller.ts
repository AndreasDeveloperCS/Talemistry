import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { MeetingInvitation } from '../model/meeting-invitation';
import { MeetingInvitationsService } from '../services/meeting-invitations.service';
import { User } from '../../users/models/user';
import { ObjectId } from 'bson';

@Controller('meeting-invitations')
@SetMetadata('entityModel', MeetingInvitation)
export class MeetingInvitationsController extends BaseController<MeetingInvitation> {
    override className: string = this.constructor.name;

    constructor(protected service: MeetingInvitationsService,
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

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        return await super.getByIdAsync(_id, request, response, ip);
    }

    @Get('position/:positionId')
    async getByPositionId(
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('get Meeting Invitations ByPositionId', positionId);
        try {
            const meetingInvitations = await this.service.getByPositionId(positionId);
            console.log('Meeting Invitations', meetingInvitations);
            return response.status(200).json(meetingInvitations);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('position/:positionId/talent/:talentId')
    async getByPositionIdTalentId(
        @Param('positionId') positionId: string,
        @Param('talentId') talentId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('get Meeting Invitations ByPositionIdTalentId', positionId, talentId);
        try {
            const meetingInvitation = await this.service.getByPositionIdTalentId(positionId, talentId);
            console.log('Meeting Invitations', meetingInvitation);
            return response.status(200).json(meetingInvitation);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('booking-token/:bookingToken')
    async getByBookingToken(
        @Param('bookingToken') bookingToken: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('get Meeting Invitations ByBookingToken', bookingToken);
        try {
            const meetingInvitations = await this.service.getByBookingToken(bookingToken);
            console.log('Meeting Invitations', meetingInvitations);
            return response.status(200).json(meetingInvitations);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Post()
    @HttpCode(201)
    async post(
        @Body() body: MeetingInvitation,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Post Meeting Invitation", body);

        try {
            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            const meetingInvitation: MeetingInvitation = {
                ...body,
                positionId: new ObjectId(body.positionId),
                templateId: body.templateId ? new ObjectId(body.templateId) : null,
                talentId: new ObjectId(body.talentId),
                recruiterId: new ObjectId(body.recruiterId),
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                userId: new ObjectId(requestingUser._id),
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date()
            };

            const createdMeetingInvitation = await this.service.createAsync(meetingInvitation);
            console.log('createdMeetingInvitation', createdMeetingInvitation);
            return response.status(200).json(createdMeetingInvitation);
        } catch (error) {
            console.error('Error creating meeting invitation:', error);
            return response.status(500).json(error);
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
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Post Meeting Invitation", body);

        try {
            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            const meetingInvitation: MeetingInvitation = {
                ...body,
                positionId: new ObjectId(body.positionId),
                templateId: body.templateId ? new ObjectId(body.templateId) : null,
                talentId: new ObjectId(body.talentId),
                recruiterId: new ObjectId(body.recruiterId),
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                userId: new ObjectId(requestingUser._id),
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date()
            };

            const updatedMeetingInvitation = await this.service.updateAsync(meetingInvitation);
            console.log('updatedMeetingInvitation', updatedMeetingInvitation);
            return response.status(200).json(updatedMeetingInvitation);
        } catch (error) {
            console.error('Error updating meeting invitation:', error);
            return response.status(500).json(error);
        }
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