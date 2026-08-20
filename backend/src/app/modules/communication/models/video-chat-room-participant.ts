import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IBaseModel, IVerifiableModel } from '../../base/models/base';

export interface IVideoChatParticipant {
    name?: string,
    email: string,
    userId?: ObjectId,
    role?: string,
    videoChatRoomId?: ObjectId,
    joinedAt?: Date
}

@Schema({ collection: 'video-chat-room-participants' })
@Entity("video-chat-room-participants")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.Verifiable)
export class VideoChatRoomParticipant implements IBaseModel, IVideoChatParticipant, IVerifiableModel, IAuditCreated {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false })
    name?: string;

    @Column()
    @Prop({ required: true })
    email: string;

    @Column()
    @Prop({ required: false })
    role?: string;
    
    @Column()
    @Prop({ required: true })
    videoChatRoomId: ObjectId;

    @Column()
    @Prop({ required: false })
    userId?: ObjectId;

    @Column()
    @Prop({ required: true, default: true })
    isVerified: boolean = true;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    joinedAt?: Date = new Date();

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();
}

export const VideoChatRoomParticipantSchema = SchemaFactory.createForClass(VideoChatRoomParticipant);

export type VideoChatRoomParticipantDocument = VideoChatRoomParticipant & Document;