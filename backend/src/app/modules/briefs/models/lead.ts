
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedEditModel, ISharedEmailsEditModel } from "../../base/models/base";
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from "bson";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IUser } from "../../users/interfaces/user.interface";
import { User } from "../../users/models/user";

export enum CommunicationMean {
    phone = 'phone',
    email = 'email',
    sms = 'sms',
    viber = 'viber',
    whatsapp = 'whatsapp',
    telegram = 'telegram',
    onlineMeeting = 'onlineMeeting',
    personalMeeting = 'personalMeeting',
}

@Schema({ collection: 'lead' })
@Entity("lead")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class Lead extends User implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel {

    @Column()
    @Prop({ required: true })
    firstname: string = '';

    @Column()
    @Prop({ required: false })
    lastname: string = '';

    @Column()
    @Prop({ required: false })
    phone: string = '';

    @Column()
    @Prop({ required: false })
    email: string = '';

    @Column()
    @Prop({ required: false })
    positionRole: string = '';

    @Column()
    @Prop({ required: false })
    companyName?: string = '';

    @Column()
    @Prop({ required: false })
    preferredCommunicationMeans: CommunicationMean[] = [];

    @Column()
    @Prop({ required: false })
    isPostponed: boolean = false;

    @Column()
    @Prop({ required: false })
    isDeligated: boolean = false;

    @Column()
    @Prop({ required: false })
    emailSharing?: string;

}

export type LeadDocument = Lead & Document;

export const LeadSchema = SchemaFactory.createForClass(Lead);