import { ObjectId } from "bson"
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedReadModel } from '../../base/models/base';
import mongoose from "mongoose";
import { CommunicationMean } from "../enums/communication-means.enum";
import { NotificationTemplate } from "../enums/notification-templates.enum";

export interface IChatMessage {
    roomId: ObjectId,               // reference to chat_rooms
    positionId?: ObjectId,        // optional reference to a Position
    senderId: ObjectId,             // reference to Users
    content: String,                // plain text (can extend to file, attachments)
    type: MessageType,
    status: IMessageStatus,
    meta?: Record<string, any>,
}

export interface ChatMessageSendPayload extends ChatMessage {
    receiverId?: string;
    variables?: TemplateVariables;
    templateName?: NotificationTemplate;
    selectedCommunicationMeans?: CommunicationMean[];
}

export interface TemplateVariables {
    positionName?: string;
    positionId?: string;
    companyName?: string;
    companyId?: string;
    timeSlot?: string;
    assessmentType?: 'test' | 'interview' | 'live-coding';
    assessmentLinkId?: string;  
    screeningLinkId?: string;
    feedbackLinkId?: string;
    calendarLinkId?: string;
    joinInterviewLink?: string;
    callerName?: string;
    callType?: string;
    directCallLink?: string;
    roomName?: string;
}

export interface MessagePreferences {
    enabled: boolean;
}

export interface IMessageStatus {
    deliveredTo: IMessageDelivery[];
    readBy: IMessageRead[];
}

export interface IMessageDelivery {
    userId: ObjectId;
    deliveredAt: Date;
}

export interface IMessageRead {
    userId: ObjectId;
    readAt: Date;
}

export enum MessageType {
    TEXT = "text",
    FILE = "file",
    SYSTEM = "system"
}

@Schema({ collection: 'chat-messages' })
@Entity("chat-messages")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class ChatMessage implements IBaseModel, IChatMessage, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    roomId: ObjectId;

    @Column()
    @Prop({ required: true })
    senderId: ObjectId;

    @Column()
    @Prop({ required: true })
    content: string;

    @Column()
    @Prop({ required: false })
    positionId?: ObjectId;

    @Column()
    @Prop({ required: true, default: MessageType.TEXT })
    type: MessageType;

    @Column()
    @Prop({ required: false, type: mongoose.Schema.Types.Mixed })
    meta?: Record<string, any>;

    @Column()
    @Prop({
        type: {
            deliveredTo: [
                {
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    deliveredAt: { type: Date, required: true }
                }
            ],
            readBy: [
                {
                    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    readAt: { type: Date, required: true }
                }
            ]
        },
        default: { deliveredTo: [], readBy: [] }
    })
    status: IMessageStatus;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false })
    modifiedDate?: Date;

    @Column()
    @Prop({ required: false })
    sharedReadIds: ObjectId[];

    @Column()
    @Prop({ required: false })
    sharedReadEmails: string[];
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// Covers: paginated room queries sorted by createdDate (cursor-based pagination)
ChatMessageSchema.index({ roomId: 1, createdDate: -1 });

// Covers: cursor tiebreaker queries (same createdDate, ordered by _id)
ChatMessageSchema.index({ roomId: 1, createdDate: -1, _id: -1 });

// Covers: getLastMessagesByRoomIds aggregation, per-room sender lookups
ChatMessageSchema.index({ roomId: 1, senderId: 1 });

// Covers: countUnreadMessages – avoids collection scan for unread counts
ChatMessageSchema.index({ roomId: 1, 'status.readBy.userId': 1, senderId: 1 });

export type ChatMessageDocument = ChatMessage & Document;