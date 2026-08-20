import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { ProfilePhotoService } from '../../profiles/services/profile-photo.service';
import { UsersService } from '../../users/services/user.service';
import { ChannelPreferences, CommunicationMean } from '../enums/communication-means.enum';
import { ChatMessage, ChatMessageDocument, MessageType, TemplateVariables } from '../models/chat-message';
import { IChatMessageResponse } from '../models/chat-message-payload';
import { NotificationsService } from './notifications.service';
import { PaginatedResource, Pagination } from '../../../helpers/pagination';
import { Filtering, FilterRule } from '../../../helpers/filtering';
import { Sorting } from '../../../helpers/sorting';
import { ChatRoomService } from './chat-room.service';
import { NotificationTemplate } from '../enums/notification-templates.enum';
import { ChatMessageSerializer } from '../serializers/chat-message.serializer';
import { NotificationContent } from '../models/notification';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationDeliveryResult } from './notifications.service';

export interface ProcessIncomingMessageResult {
    chatMessage: IChatMessageResponse | any;
    notificationResults: NotificationDeliveryResult[];
}

@Injectable()
export class ChatMessageService extends BaseService<ChatMessage> {

    constructor(
        @InjectModel(ChatMessage.name)
        protected readonly model: Model<ChatMessageDocument>,

        @InjectRepository(ChatMessage)
        protected readonly repository: Repository<ChatMessage>,

        protected readonly profilePhotoService: ProfilePhotoService,
        protected readonly userService: UsersService,
        protected notificationsService: NotificationsService,
        protected notificationTemplatesService: NotificationTemplatesService,

        @Inject(forwardRef(() => ChatRoomService))
        protected chatRoomService: ChatRoomService
    ) {
        super(model, repository);
    }

    async getAllAsync(
        pagination: Pagination,
        sort?: Sorting,
        userFilters?: Filtering
    ): Promise<any> {

        const query = this.buildMongoQuery(userFilters);
        const order = this.getMongoSort(sort);

        const [messages, total] = await Promise.all([
            this.model
                .find(query)
                .sort(order)
                .skip(pagination.offset)
                .limit(pagination.limit)
                .lean()
                .exec(),
            this.model.countDocuments(query).exec()
        ]);

        return {
            totalItems: total,
            items: await this.enrichMessages(messages),
            page: pagination.page,
            size: pagination.size,
        };
    }

    async markAsReadAsync(msgId: string, userId: ObjectId) {
        const update = {
            $addToSet: {
                'status.readBy': { userId, readAt: new Date() }
            }
        };

        return this.model
            .findByIdAndUpdate(msgId, update, { new: true })
            .exec();
    }

    async markAsDeliveredAsync(msgId: string, userId: ObjectId) {
        const update = {
            $addToSet: {
                'status.deliveredTo': { userId, deliveredAt: new Date() }
            }
        };

        return this.model
            .findByIdAndUpdate(msgId, update, { new: true })
            .exec();
    }

    async countUnreadMessages(
        roomId: string | ObjectId,
        userId: string
    ): Promise<number> {
        // Ensure userId is a string or ObjectId
        const uid = typeof userId === 'string' ? new ObjectId(userId) : userId;

        const count = await this.model.countDocuments({
            roomId: new ObjectId(roomId),
            senderId: { $ne: uid },

            'status.readBy.userId': { $ne: uid }
        }).exec();

        return count;
    }

    async getMessagesByRoomId(roomId: string | ObjectId): Promise<IChatMessageResponse[]> {
        const roomIdObj = typeof roomId === 'string' ? new ObjectId(roomId) : roomId;

        const messages = await this.model
            .find({ roomId: roomIdObj })
            .sort({ createdDate: 1 })
            .lean();

        const senderIds = [...new Set(messages.map(m => m.senderId))];

        const [userNames, photoURLs] = await Promise.all([
            this.userService.getUserNameMap(senderIds),
            this.profilePhotoService.getMainPhotoURLMap(senderIds)
        ]);

        return messages.map(m => ({
            ...m,
            senderName: userNames.get(m.senderId.toString()),
            senderPhotoUrl: photoURLs.get(m.senderId.toString())
        }));
    }

    /**
     * Cursor-based paginated retrieval of messages for a room.
     * Uses the { roomId: 1, createdDate: -1 } compound index for efficient seeks.
     * Returns newest messages first; the frontend reverses for display.
     *
     * @param roomId   – the chat room to query
     * @param limit    – number of messages to return (default 10)
     * @param before   – ISO-8601 date cursor; returns messages older than this
     * @param beforeId – ObjectId tiebreaker when multiple messages share the same createdDate
     */
    async getMessagesByRoomIdPaginated(
        roomId: string | ObjectId,
        limit: number = 10,
        before?: string,
        beforeId?: string
    ): Promise<{ items: IChatMessageResponse[]; hasMore: boolean }> {
        const roomIdObj = typeof roomId === 'string' ? new ObjectId(roomId) : roomId;

        const query: Record<string, any> = { roomId: roomIdObj };

        if (before) {
            const cursorDate = new Date(before);
            if (beforeId && ObjectId.isValid(beforeId)) {
                // Tiebreaker: messages at the exact same timestamp are ordered by _id
                query.$or = [
                    { createdDate: { $lt: cursorDate } },
                    { createdDate: cursorDate, _id: { $lt: new ObjectId(beforeId) } }
                ];
            } else {
                query.createdDate = { $lt: cursorDate };
            }
        }

        const messages = await this.model
            .find(query)
            .sort({ createdDate: -1, _id: -1 })
            .limit(limit + 1)          // fetch one extra to detect hasMore
            .maxTimeMS(5000)            // abort if MongoDB query exceeds 5 s
            .lean()
            .exec();

        const hasMore = messages.length > limit;
        const items = hasMore ? messages.slice(0, limit) : messages;

        return {
            items: await this.enrichMessages(items),
            hasMore
        };
    }

    private async enrichMessages(messages: Array<ChatMessageDocument | Record<string, any>>): Promise<IChatMessageResponse[]> {
        if (!messages?.length) {
            return [];
        }

        const senderIds = Array.from(
            new Map(
                messages
                    .filter((message) => !!message?.senderId)
                    .map((message) => [String(message.senderId), this.toObjectIdIfNeeded(message.senderId)])
            ).values()
        );

        const [userNames, photoURLs] = await Promise.all([
            this.userService.getUserNameMap(senderIds),
            this.profilePhotoService.getMainPhotoURLMap(senderIds)
        ]);

        return messages.map((message) => ({
            ...message,
            senderName: userNames.get(message.senderId?.toString()) ?? null,
            senderPhotoUrl: photoURLs.get(message.senderId?.toString()) ?? null
        })) as IChatMessageResponse[];
    }

    private buildMongoQuery(userFilters?: Filtering): Record<string, any> {
        const query: Record<string, any> = {};

        for (const filter of userFilters ?? []) {
            if (!filter?.property || !filter.rule) {
                continue;
            }

            const property = filter.property;
            const value = filter.value;

            switch (filter.rule) {
                case FilterRule.EQUALS:
                    this.setFieldCondition(query, property, this.normalizeEqualityValue(property, value));
                    break;
                case FilterRule.NOT_EQUALS:
                    this.mergeFieldCondition(query, property, { $ne: this.normalizeEqualityValue(property, value) });
                    break;
                case FilterRule.GREATER_THAN:
                    this.mergeFieldCondition(query, property, { $gt: this.normalizeComparableValue(value) });
                    break;
                case FilterRule.GREATER_THAN_OR_EQUALS:
                    this.mergeFieldCondition(query, property, { $gte: this.normalizeComparableValue(value) });
                    break;
                case FilterRule.LESS_THAN:
                    this.mergeFieldCondition(query, property, { $lt: this.normalizeComparableValue(value) });
                    break;
                case FilterRule.LESS_THAN_OR_EQUALS:
                    this.mergeFieldCondition(query, property, { $lte: this.normalizeComparableValue(value) });
                    break;
                case FilterRule.LIKE:
                    this.mergeFieldCondition(query, property, { $regex: `.*${value}.*`, $options: 'i' });
                    break;
                case FilterRule.IN:
                    this.mergeFieldCondition(query, property, {
                        $in: this.normalizeCollectionValue(property, value)
                    });
                    break;
                case FilterRule.NOT_IN:
                    this.mergeFieldCondition(query, property, {
                        $nin: this.normalizeCollectionValue(property, value)
                    });
                    break;
                case FilterRule.IS_NULL:
                    this.setFieldCondition(query, property, null);
                    break;
                case FilterRule.IS_NOT_NULL:
                    this.mergeFieldCondition(query, property, { $ne: null });
                    break;
                default:
                    break;
            }
        }

        return query;
    }

    private getMongoSort(sort?: Sorting): Record<string, 1 | -1> {
        if (!sort?.property) {
            return { createdDate: -1 };
        }

        return {
            [sort.property]: String(sort.direction || '').toUpperCase() === 'ASC' ? 1 : -1
        };
    }

    private setFieldCondition(query: Record<string, any>, property: string, value: any): void {
        query[property] = value;
    }

    private mergeFieldCondition(query: Record<string, any>, property: string, value: Record<string, any>): void {
        const existing = query[property];

        if (existing && typeof existing === 'object' && !Array.isArray(existing) && !(existing instanceof ObjectId)) {
            query[property] = {
                ...existing,
                ...value,
            };
            return;
        }

        query[property] = value;
    }

    private normalizeEqualityValue(property: string, value: any): any {
        if (this.isObjectIdProperty(property)) {
            return this.toObjectIdIfNeeded(value);
        }

        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            return { $regex: value };
        }

        return value;
    }

    private normalizeComparableValue(value: any): any {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }

        return value;
    }

    private normalizeCollectionValue(property: string, value: any): any[] {
        const values = Array.isArray(value) ? value : String(value || '').split(',');
        return this.isObjectIdProperty(property)
            ? values.map((entry) => this.toObjectIdIfNeeded(entry))
            : values;
    }

    private isObjectIdProperty(property: string): boolean {
        return property === '_id'
            || property === 'createdBy'
            || property.split('.').some((segment) => segment.endsWith('Id'));
    }

    private toObjectIdIfNeeded(value: any): any {
        if (value instanceof ObjectId) {
            return value;
        }

        const normalizedValue = String(value || '').trim();
        return ObjectId.isValid(normalizedValue) ? new ObjectId(normalizedValue) : value;
    }

    async enrichWithSenderPhoto(savedMessage: any): Promise<IChatMessageResponse> {
        const senderId = savedMessage.senderId;

        const [userNames, photoURLs] = await Promise.all([
            this.userService.getUserNameMap([senderId]),
            this.profilePhotoService.getMainPhotoURLMap([senderId]),
        ]);

        return {
            ...savedMessage.toObject(),
            senderName: userNames.get(senderId.toString()),
            senderPhotoUrl: photoURLs.get(senderId.toString()),
        };
    }

    async getChannelPreferences(
        communicationMeans: CommunicationMean[],
    ): Promise<ChannelPreferences> {
        const preferences: ChannelPreferences = {
            enabled: true,
            sms: communicationMeans.includes(CommunicationMean.sms),
            viber: communicationMeans.includes(CommunicationMean.viber),
            whatsapp: communicationMeans.includes(CommunicationMean.whatsapp),
            email: communicationMeans.includes(CommunicationMean.email),
            telegram: communicationMeans.includes(CommunicationMean.telegram),
        };

        return preferences;
    }

    async getLastMessagesByRoomIds(roomIds: ObjectId[]): Promise<Map<string, any>> {
        const lastMessages = await this.model.aggregate([
            {
                $match: {
                    roomId: { $in: roomIds }
                }
            },
            {
                $sort: { createdDate: -1 } // newest first
            },
            {
                $group: {
                    _id: "$roomId",
                    lastReadMessageId: { $first: "$_id" },
                    lastMessageText: { $first: "$content" },
                    lastMessageDate: { $first: "$createdDate" },
                    lastMessageSenderId: { $first: "$senderId" },
                    lastMessageStatus: { $first: "$status" } // <-- add status here
                }
            }
        ]);

        const map = new Map<string, any>();

        lastMessages.forEach(m => {
            map.set(m._id.toString(), {
                text: m.lastMessageText,
                date: m.lastMessageDate,
                lastReadMessageId: m.lastReadMessageId,
                senderId: m.lastMessageSenderId,
                status: m.lastMessageStatus // <-- include status
            });
        });

        return map;
    }

    async processIncomingMessage(
        senderId: ObjectId,
        payload: {
            roomId: string;
            content: string;
            receiverId: string;
            communicationMeans?: CommunicationMean[];
            templateName?: NotificationTemplate;
            type?: MessageType;
            meta?: Record<string, any>;
            skipExternalNotification?: boolean;
        },
        variables?: TemplateVariables
    ): Promise<ProcessIncomingMessageResult | null> {

        const receiver = await this.userService.getByIdAsync(payload.receiverId);

        if (!payload.skipExternalNotification && payload.type !== MessageType.SYSTEM && !receiver?.phone && !receiver?.email) {
            return null;
        }

        let platformContent = payload.content;
        let notificationContent: NotificationContent | null = null;

        if (payload.templateName && !payload.skipExternalNotification) {

            notificationContent =
                this.notificationTemplatesService.getMessageContent(
                    receiver.firstname,
                    payload.templateName,
                    variables
                );

            if (payload.templateName !== NotificationTemplate.NEW_CHAT_MESSAGE && payload.type !== MessageType.SYSTEM) {
                // payload.content = ChatMessageSerializer.toPlainText(notificationContent);
                platformContent = ChatMessageSerializer.toHtml(notificationContent);
            }
        }

        const chatMessageBody = {
            roomId: new ObjectId(payload.roomId),
            senderId,
            // content: payload.content,
            content: platformContent,
            type: payload.type ?? MessageType.TEXT,
            meta: payload.meta,
            status: {
                deliveredTo: [],
                readBy: []
            },
            userId: senderId,
            createdBy: senderId,
            createdDate: new Date(),
            sharedReadIds: [],
            sharedReadEmails: []
        };

        const savedMessage = await this.createAsync(chatMessageBody);

        const chatMessage = await this.enrichWithSenderPhoto(savedMessage);

        await this.chatRoomService.patchAsync(
            chatMessageBody.roomId,
            "modifiedDate",
            new Date()
        );

        let notificationResults: NotificationDeliveryResult[] = [];

        if (!payload.skipExternalNotification && notificationContent && payload.communicationMeans?.length) {

            const preferences =
                await this.getChannelPreferences(payload.communicationMeans);

            notificationResults = await this.notificationsService.notifyUserAboutNewMessage(
                {
                    phoneNumber: receiver.phone,
                    firstName: receiver.firstname,
                    email: receiver.email,
                    telegramChatId: receiver.telegram?.chatId,
                    preferences
                },
                notificationContent,
                payload.templateName
            );

        }

        return {
            chatMessage,
            notificationResults,
        };

    }

    async createSystemMessage(
        senderId: ObjectId,
        payload: {
            roomId: string;
            receiverId: string;
            content: string;
            meta?: Record<string, any>;
        }
    ) {
        const result = await this.processIncomingMessage(senderId, {
            ...payload,
            type: MessageType.SYSTEM,
            skipExternalNotification: true,
        });

        return result?.chatMessage ?? null;
    }

    async hasDirectCallOutcomeSince(
        chatRoomId: string,
        directRoomId: string,
        sentAt: number,
        targetUserId?: string,
    ): Promise<boolean> {
        const normalizedChatRoomId = String(chatRoomId || '').trim();
        const normalizedDirectRoomId = String(directRoomId || '').trim();

        if (!normalizedChatRoomId || !normalizedDirectRoomId) {
            return false;
        }

        const roomObjectId = new ObjectId(normalizedChatRoomId);
        const createdAfter = new Date(Number(sentAt || Date.now()));
        const normalizedTargetUserId = String(targetUserId || '').trim();

        const answeredQuery = normalizedTargetUserId
            ? {
                'meta.kind': 'direct-call-answered',
                'meta.actorUserId': normalizedTargetUserId,
            }
            : {
                'meta.kind': 'direct-call-answered',
            };

        const outcomeCount = await this.model.countDocuments({
            roomId: roomObjectId,
            type: MessageType.SYSTEM,
            createdDate: { $gte: createdAfter },
            'meta.roomId': normalizedDirectRoomId,
            $or: [
                answeredQuery,
                { 'meta.kind': 'direct-call-ended' },
                { 'meta.kind': 'direct-call-missed' },
            ],
        }).exec();

        return outcomeCount > 0;
    }

    async markAsReadManyAsync(messageIds: string[], userId: string) {
        for (const msgId of messageIds) {
            await this.markAsReadAsync(msgId, new ObjectId(userId));
        }
    }

    async markAsDeliveredManyAsync(messageIds: string[], userId: string) {
        for (const msgId of messageIds) {
            await this.markAsDeliveredAsync(msgId, new ObjectId(userId));
        }
    }
}