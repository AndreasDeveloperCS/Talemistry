import { ObjectId } from "bson"
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedReadModel } from '../../base/models/base';

export enum ChatRoomType {
    DIRECT = "direct",
    GROUP = "group",
    SELF = "self",
    STAGE = "stage" // chat room for a specific interview stage, includes all participants of that stage
}

export interface IParticipant {
    userId: ObjectId,           // reference to Users
    role?: string,               // e.g. candidate, recruiter, admin
    joinedAt?: Date,
    lastReadMessageId?: ObjectId // useful for read receipts per participant
}

export interface IChatRoom {

    type: ChatRoomType,
    positionId?: ObjectId,           // optional reference to a Position
    pipelineStageId?: ObjectId,     // optional reference to a Pipeline Stage (for STAGE type rooms)
    participants: IParticipant[]
}

@Schema({ collection: 'chat-rooms' })
@Entity("chat-rooms")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class ChatRoom implements IBaseModel, IChatRoom, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    type: ChatRoomType = ChatRoomType.DIRECT; // "direct" | "group"

    @Column()
    @Prop({ required: false })
    name?: string; // for group chats

    @Column()
    @Prop({ required: false })
    positionId?: ObjectId; // optional link to recruitment position


    @Column()
    @Prop({ required: false })
    pipelineStageId?: ObjectId;

    @Column()
    @Prop({ required: true, default: [] })
    participants: IParticipant[];

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

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);

export type ChatRoomDocument = ChatRoom & Document;
