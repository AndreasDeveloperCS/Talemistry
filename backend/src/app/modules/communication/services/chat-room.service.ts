import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { ChatRoom, ChatRoomDocument, ChatRoomType } from '../models/chat-room';
import { ObjectId } from 'bson';
import { IChatRoomSummary } from '../models/chat-message-payload';
import { ProfilePhotoService } from '../../profiles/services/profile-photo.service';
import { UsersService } from '../../users/services/user.service';
import { AnyARecord } from 'dns';
import { ChatMessageService } from './chat-message.service';
import { Pagination } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { Filtering } from '../../../helpers/filtering';

@Injectable()
export class ChatRoomService extends BaseService<ChatRoom> {

    constructor(
        @InjectModel(ChatRoom.name)
        protected readonly model: Model<ChatRoomDocument>,

        @InjectRepository(ChatRoom)
        protected readonly repository: Repository<ChatRoom>,

        protected readonly profilePhotoService: ProfilePhotoService,
        protected readonly userService: UsersService,

        @Inject(forwardRef(() => ChatMessageService))
        protected readonly chatMessagesService: ChatMessageService
    ) {
        super(model, repository);
    }

    async getAllAsync(
        pagination: Pagination,
        sort?: Sorting,
        userFilters?: Filtering
    ): Promise<any> {
        const result = await super.getAllAsync(pagination, sort, userFilters);

        const rooms = result.items;
        // console.log('Chat Room items', result);

        if (!rooms || rooms.length === 0) {
            return result;
        }

        const roomIds = rooms.map(r => r._id);

        const lastMessagesMap = await this.chatMessagesService.getLastMessagesByRoomIds(roomIds);

        const participantFilter = userFilters?.find(f => f.property === 'participants.userId');
        const currentUserId = participantFilter?.value;

        const otherParticipantIds = [
            ...new Set(
                rooms.flatMap(room =>
                    room.participants
                        .map(p => p.userId)
                        .filter(id => id !== currentUserId)
                )
            )
        ];

        const [photoURLs, userContacts] = await Promise.all([
            this.profilePhotoService.getMainPhotoURLMap(otherParticipantIds),
            this.userService.getUserContactMap(otherParticipantIds)
        ]);

        const enrichedRooms: IChatRoomSummary[] = await Promise.all(
            rooms.map(async room => {
                const lastMessage = lastMessagesMap.get(room._id.toString());
                console.log('Last Message Info', lastMessage);

                let unreadCount = 0;
                if (lastMessage?.status?.readBy) {
                    const currentUserIdStr = currentUserId.toString();

                    if (lastMessage.senderId?.toString() !== currentUserIdStr) {
                        const isRead = lastMessage.status.readBy.some(r =>
                            r.userId?.toString() === currentUserIdStr
                        );

                        console.log(
                            'currentUserIdStr', currentUserIdStr,
                            'lastMessage.status.readBy', lastMessage.status.readBy,
                            'isRead', isRead
                        );

                        if (!isRead) {
                            unreadCount = await this.chatMessagesService.countUnreadMessages(
                                room._id,
                                currentUserIdStr
                            );
                        }
                    }
                }

                let lastMessageStatus: 'delivered' | 'read' | null = null;
                //console.log('Last Message Status', lastMessage, lastMessage.senderId, lastMessage.status?.readBy?.length);
                if (lastMessage && lastMessage.senderId) {
                    const senderIdStr = lastMessage.senderId.toString();
                    const currentUserIdStr = currentUserId.toString();
                    if (senderIdStr === currentUserIdStr) {
                        lastMessageStatus = lastMessage.status?.readBy?.length > 0 ? 'read' : 'delivered';
                    }
                }

                // 6c️⃣ Build participant info
                const participants = room.participants.map(p => ({
                    contactId: p.userId?.toString() ?? null,
                    contactName: userContacts.get(p.userId?.toString() ?? '')?.name ?? p.role ?? null,
                    email: userContacts.get(p.userId?.toString() ?? '')?.email ?? null,
                    username: userContacts.get(p.userId?.toString() ?? '')?.username ?? null,
                    role: p.role,
                    photoUrl: photoURLs.get(p.userId?.toString() ?? '') ?? null
                }));

                return {
                    _id: room._id.toString(),
                    type: room.type,
                    name: room.name,
                    positionId: room.positionId?.toString() ?? null,
                    lastReadMessageId: lastMessage?.lastReadMessageId ?? null,
                    lastMessageText: lastMessage?.text ?? null,
                    lastMessageDate: lastMessage?.date ?? null,
                    participants,
                    unreadCount,
                    lastMessageStatus
                };
            })
        );
        enrichedRooms.sort((a, b) => {
            const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
            const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
            return dateB - dateA;
        });

        return {
            ...result,
            items: enrichedRooms
        };
    }

    async findOrCreateRoomAsync(body: Partial<ChatRoom>): Promise<ChatRoom> {
        const participantIds = [...new Set(body.participants.map(p => p.userId.toString()))].sort();
        const normalizedRoomName = String(body.name || '').trim();

        body.participants = participantIds.map(id => ({ userId: new ObjectId(id), joinedAt: new Date() }));
        if (participantIds.length === 1) {
            body.type = ChatRoomType.SELF;
        }

        if (body.type === ChatRoomType.DIRECT) {
            body.name = normalizedRoomName || undefined;
        }

        const existingRoomQuery: Record<string, any> = {
            type: body.type,
            participants: {
                $all: participantIds.map(id => ({ $elemMatch: { userId: new ObjectId(id) } }))
            },
            $expr: { $eq: [{ $size: "$participants" }, participantIds.length] }
        };

        if (body.type === ChatRoomType.DIRECT) {
            if (normalizedRoomName) {
                existingRoomQuery.name = normalizedRoomName;
            } else {
                existingRoomQuery.$or = [
                    { name: { $exists: false } },
                    { name: null },
                    { name: '' }
                ];
            }
        }

        const existingRoom = await this.model.findOne(existingRoomQuery).lean();

        console.log('Check if existingRoom', existingRoom);

        if (existingRoom) {
            return existingRoom as ChatRoom;
        }

        const newRoom = new this.model({
            ...body,
            createdDate: new Date()
        });

        return await newRoom.save();
    }

    async getByUserIdAsync(participantId: any): Promise<ChatRoom[] | null> {
        const participantIdObj =
            typeof participantId === 'string'
                ? new ObjectId(participantId)
                : participantId;

        console.log('Participant id obj', participantIdObj);

        const rooms = await this.model.find({
            "participants.userId": participantIdObj,
        }).lean();

        return rooms;
    }

    async getByParticipantIdAsync(participantId: any): Promise<IChatRoomSummary[]> {

        const participantIdObj =
            typeof participantId === 'string'
                ? new ObjectId(participantId)
                : participantId;

        const rooms = await this.model.find({
            "participants.userId": participantIdObj,
        }).lean();

        const roomIds = rooms.map(r => r._id);

        const lastMessagesMap =
            await this.chatMessagesService.getLastMessagesByRoomIds(roomIds);

        const otherParticipantIds = rooms.flatMap(room =>
            room.participants
                .map((p: any) => p.userId)
                .filter((id: any) => id.toString() !== participantIdObj.toString())
        );

        const [photoURLs, userContacts] = await Promise.all([
            this.profilePhotoService.getMainPhotoURLMap(otherParticipantIds),
            this.userService.getUserContactMap(otherParticipantIds),
        ]);

        const roomsSummary = rooms.map(room => {

            const lastMessage = lastMessagesMap.get(room._id.toString());

            return {
                _id: room._id.toString(),
                type: room.type,
                name: room.name,
                positionId: room.positionId?.toString(),
                lastReadMessageId: lastMessage?._id ?? null,
                lastMessageText: lastMessage?.text ?? null,
                lastMessageDate: lastMessage?.date ?? null,

                participants: room.participants.map((p: any) => ({
                    contactId: p.userId.toString(),
                    contactName: userContacts.get(p.userId.toString())?.name ?? null,
                    email: userContacts.get(p.userId.toString())?.email ?? null,
                    username: userContacts.get(p.userId.toString())?.username ?? null,
                    role: p.role,
                    photoUrl: photoURLs.get(p.userId.toString()) ?? null,
                })),
            } as IChatRoomSummary;
        });

        // Sort by last message date
        roomsSummary.sort((a, b) => {
            const dateA = a.lastMessageDate ? new Date(a.lastMessageDate).getTime() : 0;
            const dateB = b.lastMessageDate ? new Date(b.lastMessageDate).getTime() : 0;
            return dateB - dateA;
        });

        return roomsSummary;
    }
}
