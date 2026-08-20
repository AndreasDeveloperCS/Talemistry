import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from '../../base/models/base';
import { MeetingPlatfrom, ParticipantInfo } from './meeting';
import { SlotDuration } from "./schedule-settings";

@Schema({ collection: 'meeting-templates' })
@Entity("meeting-templates")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class MeetingTemplate implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId; // recruiter who created the template

    @Column()
    @Prop({ required: true })
    topic: string = '';

    @Column()
    @Prop({ required: true })
    agenda: string = '';

    @Column()
    @Prop()
    expiresAt?: Date;

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
    createdBy: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate?: Date;
}

export const MeetingTemplateSchema = SchemaFactory.createForClass(MeetingTemplate);
export type MeetingTemplateDocument = MeetingTemplate & Document;