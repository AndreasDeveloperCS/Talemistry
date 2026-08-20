import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from '../../base/models/base';
import { MeetingPlatfrom, ParticipantInfo } from './meeting';
import { SlotDuration } from './schedule-settings';

export enum InvitationStatus {
  draft,
  sent,
  viewed,
  booked,
  expired,
  cancelled
}

@Schema({ collection: 'meeting-invitations' })
@Entity("meeting-invitations")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.OwnerModel)
export class MeetingInvitation implements IBaseModel, IAuditCreated, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

    @Column()
    @Prop({ required: true })
    recruiterId: ObjectId;

    @Column()
    @Prop({ required: true })
    talentId: ObjectId;
    
    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop()
    templateId?: ObjectId;

    @Column()
    @Prop({ required: true })
    topic: string;

    @Column()
    @Prop({ required: true })
    agenda: string;

    @Column()
    @Prop({ required: false })
    meetingId?: ObjectId;

    @Column()
    @Prop({ required: true, unique: true })
    bookingToken: string;
    
    @Column()
    @Prop({ required: true })
    startDate: Date = new Date();

    @Column()
    @Prop({ required: true })
    endDate?: Date = new Date();

    @Column()
    @Prop({ required: false })
    timeZone?: string;

    @Column()
    @Prop({ required: false })
    participants?: ParticipantInfo[] = [];

    @Column()
    @Prop({ required: true })
    platform?: MeetingPlatfrom = MeetingPlatfrom.EVRYKA;

    @Column()
    @Prop({ required: true })
    selectedSlotPeriod: SlotDuration = SlotDuration.half;

    @Column()
    @Prop({ required: true })
    status: InvitationStatus = InvitationStatus.sent;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    createdDate: Date;
}

export const MeetingInvitationSchema = SchemaFactory.createForClass(MeetingInvitation);
export type MeetingInvitationDocument = MeetingInvitation & Document;