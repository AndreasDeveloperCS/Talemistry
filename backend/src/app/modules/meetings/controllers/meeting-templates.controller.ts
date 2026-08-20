import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { User } from '../../users/models/user';
import { ObjectId } from 'bson';
import { MeetingTemplate } from '../model/meeting-template';
import { MeetingTemplatesService } from '../services/meeting-templates.service';

@Controller('meeting-templates')
@SetMetadata('entityModel', MeetingTemplate)
export class MeetingTemplatesController extends BaseController<MeetingTemplate> {
    override className: string = this.constructor.name;

    constructor(protected service: MeetingTemplatesService,
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
        console.log('get Meeting Templates ByPositionId', positionId);
        try {
            const meetingTemplates = await this.service.getByPositionId(positionId);
            console.log('Meeting Templates', meetingTemplates);
            return response.status(200).json(meetingTemplates);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Post()
    @HttpCode(201)
    async post(
        @Body() body: MeetingTemplate,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Post Meeting Template", body);

        try {
            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            const meetingTemplate: MeetingTemplate = {
                ...body,
                positionId: new ObjectId(body.positionId),
                //talentId: new ObjectId(body.talentId),
                //recruiterId: new ObjectId(body.recruiterId),
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                userId: new ObjectId(requestingUser._id),
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date(),
            };

            const createdMeetingTemplate = await this.service.createAsync(meetingTemplate);
            console.log('createdMeetingTemplate', createdMeetingTemplate);
            return response.status(200).json(createdMeetingTemplate);
        } catch (error) {
            console.error('Error creating meeting template:', error);
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