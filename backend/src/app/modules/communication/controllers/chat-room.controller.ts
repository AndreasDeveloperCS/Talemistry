import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { User } from '../../users/models/user';
import { ChatRoom } from '../models/chat-room';
import { ChatRoomService } from '../services/chat-room.service';
import { Filtering } from '../../../helpers/filtering';
import { Sorting } from '../../../helpers/sorting';

@Controller('chat-rooms')
@SetMetadata('entityModel', ChatRoom)
export class ChatRoomController extends BaseController<ChatRoom> {
    override className: string = this.constructor.name;

    constructor(protected service: ChatRoomService,
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
        console.log('GetAllAsync Chat Rooms', paginationParams, sortParams, filterParams);

        try {
            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
            const filtering: Filtering = filterParams ? JSON.parse(filterParams) : undefined;

            const paginationResult = await this.service.getAllAsync(paginationParams, sorting, filtering);
            return response.status(200).json(paginationResult);

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

    @Get('user/:userId')
    async getByUserIdAsync(
        @Param('userId') userId: string,
        @Req() request: Request,
        @Res() response: Response
        ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get('user/:userId')", userId);

        try {
            const chatRoomsByUserId = await this.service.getByUserIdAsync(userId);
            if (!chatRoomsByUserId) {
                return response.status(200).json(null); 
            }
            return response.status(200).json(chatRoomsByUserId);
        } catch (error) {
            console.error('Error fetching chat rooms by userId:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get('participant/:participantId')
    async getByParticipantIdAsync(
        @Param('participantId') participantId: string,
        @Req() request: Request,
        @Res() response: Response
        ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get('user/:userId')", participantId);

        try {
            const chatRoomsByParticipantId = await this.service.getByParticipantIdAsync(participantId);
            if (!chatRoomsByParticipantId) {
                return response.status(200).json(null); 
            }
            return response.status(200).json(chatRoomsByParticipantId);
        } catch (error) {
            console.error('Error fetching chat rooms by participantId:', error);
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
            console.log(`ChatRoom Inserted entity:`, body);
            const requestingUser: User = this.utilitiesService?.getUser(request);
            body.participants = body.participants.map(p => ({
                ...p,
                userId: new ObjectId(p.userId),
                joinedAt: p.joinedAt || new Date()
            }));

            body.userId = new ObjectId(body.userId);
            body.createdBy = new ObjectId(requestingUser._id);

            const chatRoom = await this.service.findOrCreateRoomAsync(body);
            console.log('Create chat room', chatRoom);
            return response.status(201).send(chatRoom);
        } catch (error: any) {
            console.error(error);
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