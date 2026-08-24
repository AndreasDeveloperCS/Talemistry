import { ObjectId } from "bson"
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedReadModel, IVerifiableModel } from '../../base/models/base';
import { IVideoChatParticipant } from "./video-chat-room-participant";

export enum VideoChatRoomType {
    DIRECT = "direct",
    GROUP = "group",
    STAGE = "stage",
    SELF = "self"
}

export interface IVideoChatRoom {
    name: string,
    type: VideoChatRoomType,
    positionId?: ObjectId,
    pipelineStageId?: ObjectId,
    participants?: IVideoChatParticipant[],
    joinToken?: string,
    isOpenMeeting?: boolean,
    isDefault?: boolean
}

export interface IEnrichedVideoChatRoom extends IVideoChatRoom {
    participants: IVideoChatParticipant[];
}

@Schema({ collection: 'video-chat-rooms' })
@Entity("video-chat-rooms")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.Verifiable, INTERFACES.OwnerModel, INTERFACES.AuditModified)
export class VideoChatRoom implements IBaseModel, IVideoChatRoom, IOwnerModel, IVerifiableModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    type: VideoChatRoomType = VideoChatRoomType.DIRECT;

    @Column()
    @Prop({ required: true })
    name: string;

    @Column()
    @Prop({ required: false })
    positionId?: ObjectId;

    @Column()
    @Prop({ required: false })
    pipelineStageId?: ObjectId;

    @Column()
    @Prop({ required: false, default: [] })
    participants?: IVideoChatParticipant[];

    // Secret token used for "join by link". Allows adding a user to participants
    // even if their email/account differs from the originally invited email.
    @Column()
    @Prop({ required: false, index: true })
    joinToken?: string;

    // When true AND type is GROUP, any user with the link can join without
    // being in the original participants list.  The joining user is
    // automatically appended to participants on first access.
    @Column()
    @Prop({ required: false, default: false })
    isOpenMeeting?: boolean;

    // Marks a room as a "default" meeting that should always be discoverable
    // in the lobby/table for authenticated users.
    @Column()
    @Prop({ required: false, default: false, index: true })
    isDefault?: boolean;

    @Column()
    @Prop({ required: true, default: true })
    isVerified: boolean = true;

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
}

export const VideoChatRoomSchema = SchemaFactory.createForClass(VideoChatRoom);

export type VideoChatRoomDocument = VideoChatRoom & Document;
