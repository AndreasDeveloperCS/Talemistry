import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { ActivityAccessStatus, RecruiterActivityAccess } from '../models/recruiter-activity-access.model';
import { RecruiterActivityAccessService } from '../services/recruiter-activity-access.service';

@Controller('recruiter-activity-access')
@SetMetadata('entityModel', RecruiterActivityAccess)
export class RecruiterActivityAccessController extends BaseController<RecruiterActivityAccess> {
    override className: string = this.constructor.name;

    constructor(protected service: RecruiterActivityAccessService,
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
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    }

    @Get('my')
    async getMyActivityAccess(
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try{
            console.log(`RecruiterActivityAccess Controller Get('my') request:`);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }
            const result = await this.service.getMyActivityAccess(requestingUser._id)
            console.log('RecruiterActivityAccess has been received', result);

            return response.status(200).send(result);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get('search')
    async searchRecruitersByEmail(
        @Query('email') email: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try{
            console.log(`RecruiterActivityAccess Controller Get('search') request:`);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }
            if (!email) {
                return response.status(400).json({ message: 'No email provided' });
            }
            const result = await this.service.searchRecruitersByEmail(requestingUser, email);
            console.log('Recruiter has been found', result);

            return response.status(200).send(result);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        return await super.getByIdAsync(_id, request, response, ip);
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

        try{
            console.log(`RecruiterActivityAccess Controller Insert request:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }
            if (body.recruiterId === requestingUser._id) {
                return response.status(400).json({
                    message: 'You cannot send a request to yourself.'
                });
            }
            const existing = await this.service.findExistingRequest(
                body.recruiterId,
                requestingUser._id
            );

            if (existing) {
                return response.status(409).json({
                    message: 'An activity access request already exists.'
                });
            }
            let entity: RecruiterActivityAccess = { 
                ...body,
                supervisorId: new ObjectId(body.supervisorId),
                recruiterId: new ObjectId(body.recruiterId),
                status: ActivityAccessStatus.Pending,
                userId: new ObjectId(requestingUser._id),
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date()
            };

            const createdEntity: RecruiterActivityAccess = await this.service.createAsync(entity);
            console.log('RecruiterActivityAccess has been created', createdEntity);

            return response.status(200).send(createdEntity);
        } catch (error) {
            console.error(error);
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