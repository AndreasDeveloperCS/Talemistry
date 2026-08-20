import { Body, Controller, Delete, Get, HttpCode, Ip, NotFoundException, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ObjectId } from 'bson';
import { Request, Response } from 'express';
import { Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { UsersService } from '../../users/services/user.service';
import { ChannelPreferences } from '../enums/communication-means.enum';
import { NotificationTemplate } from '../enums/notification-templates.enum';
import { ChatMessage, ChatMessageSendPayload } from '../models/chat-message';
import { NotificationContent } from '../models/notification';
import { ChatMessageSerializer } from '../serializers/chat-message.serializer';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatMessageService } from '../services/chat-message.service';
import { NotificationTemplatesService } from '../services/notification-templates.service';
import { NotificationsService } from '../services/notifications.service';
import { Filtering, FilterRule } from '../../../helpers/filtering';
import { Sorting } from '../../../helpers/sorting';
import { ChatRoomService } from '../services/chat-room.service';

@Controller('chat-messages')
@SetMetadata('entityModel', ChatMessage)
export class ChatMessageController extends BaseController<ChatMessage> {
    override className: string = this.constructor.name;

    constructor(protected service: ChatMessageService,
        protected userService: UsersService,
        protected chatRoomService: ChatRoomService,
        protected notificationsService: NotificationsService,
        protected notificationTemplatesService: NotificationTemplatesService,
        protected chatGateway: ChatGateway,
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
        console.log('GetAllAsync Chat Messages', paginationParams, sortParams, filterParams);

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

    @Get('room/:roomId/recent')
    async getRecentByRoomId(
        @Param('roomId') roomId: string,
        @Query('limit') limitParam: string,
        @Query('before') before: string,
        @Query('beforeId') beforeId: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const limit = Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 50);
            const result = await this.service.getMessagesByRoomIdPaginated(
                roomId,
                limit,
                before || undefined,
                beforeId || undefined
            );
            return response.status(200).json(result);
        } catch (error) {
            console.error('Error fetching recent messages:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get('room/:roomId')
    async getByUserIdAsync(
        @Param('roomId') roomId: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log("@Get('room/:roomId')", roomId);

        try {
            const messagesByRoomId = await this.service.getMessagesByRoomId(roomId);
            if (!messagesByRoomId) {
                return response.status(200).json(null);
            }
            return response.status(200).json(messagesByRoomId);
        } catch (error) {
            console.error('Error fetching chat rooms by userId:', error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    }

    @Post('new-stage-message')
    @HttpCode(201)
    async postNewStageMessage(
        @Body() body: any,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            console.log(`ChatMessage Inserted entity:`, body);
            const requestingUser = this.utilitiesService.getUser(request);

            const { receiverId, selectedCommunicationMeans, variables, templateName, ...chatMessageBody }: ChatMessageSendPayload = body;


            const user = await this.userService.getByIdAsync(receiverId);
            if (!user?.phone && !user?.email) {
                return;
            }

            let notificationContent: NotificationContent | null = null;

            if (templateName) {
                notificationContent =
                    this.notificationTemplatesService.getMessageContent(
                        user.firstname,
                        templateName,
                        variables,
                    );
                console.log('NotificationContent', notificationContent);

                if (templateName !== NotificationTemplate.NEW_CHAT_MESSAGE) {
                    chatMessageBody.content = ChatMessageSerializer.toPlainText(notificationContent);
                }
            }

            chatMessageBody.roomId = new ObjectId(chatMessageBody.roomId);
            chatMessageBody.senderId = new ObjectId(chatMessageBody.senderId);
            chatMessageBody.userId = new ObjectId(requestingUser._id);
            chatMessageBody.createdBy = new ObjectId(requestingUser._id);

            const savedMessage = await this.service.createAsync(chatMessageBody);
            const chatMessage = await this.service.enrichWithSenderPhoto(savedMessage);

            if (chatMessage) {
                const res = await this.chatRoomService.patchAsync(chatMessageBody.roomId, 'modifiedDate', new Date());
            }

            if (notificationContent && selectedCommunicationMeans?.length) {
                const preferences: ChannelPreferences = await this.service.getChannelPreferences(
                    selectedCommunicationMeans,
                );

                await this.notificationsService.notifyUserAboutNewMessage(
                    {
                        phoneNumber: user.phone,
                        firstName: user.firstname,
                        email: user.email,
                        telegramChatId: user.telegram?.chatId,
                        preferences,
                    },
                    notificationContent,
                    templateName,
                    variables,
                );
            }
            return response.status(201).send(chatMessage);
        } catch (error: any) {
            console.error(error);
            return response.status(500).send(error);
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
            const requestingUser = this.utilitiesService.getUser(request);

            const result = await this.service.processIncomingMessage(new ObjectId(requestingUser._id), body);

            if (!result?.chatMessage) {
                return response.status(400).send({
                    message: 'Message could not be created'
                });
            }

            const metaKind = String(body?.meta?.kind ?? '').trim().toLowerCase();
            const roomId = String(result.chatMessage?.roomId ?? body?.roomId ?? '').trim();
            const isDirectCallSystemMessage = body?.type === 'system'
                && roomId
                && metaKind.startsWith('direct-call-');

            if (isDirectCallSystemMessage) {
                this.chatGateway.server?.to(roomId).emit('new-message', result.chatMessage);
            }

            return response.status(201).send(result.chatMessage);
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

    @Patch(':id/read')
    async markAsRead(
        @Param('id') msgId: string,
        @Body() body: string,
        @Req() request: Request,
        @Res() response: Response
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            const requestingUser = this.utilitiesService.getUser(request);
            let updatedMessage = await this.service.markAsReadAsync(msgId, requestingUser._id);
            updatedMessage = await this.service.markAsDeliveredAsync(msgId, requestingUser._id);

            if (!updatedMessage) {
                return response.status(404).send({ message: 'Message not found' });
            }

            console.log('Updated message', updatedMessage);
            return response.status(200).send(updatedMessage);
        } catch (error: any) {
            console.error(error);
            return response.status(500).send(error);
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