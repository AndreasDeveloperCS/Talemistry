import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ObjectId } from "bson";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel } from "../../base/models/base";

@Schema({ collection: 'calendar-invitations' })
@Entity("calendar-invitations")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedModel)
export class CalendarInvitation implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    sharedReadIds: ObjectId[];

    @Column()
    @Prop({ required: true })
    sharedReadEmails: string[];

    @Column()
    @Prop({ required: true })
    sharedEditIds: ObjectId[];

    @Column()
    @Prop({ required: true })
    sharedEditEmails: string[];

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
    modifiedDate: Date;
}

export const CalendarInvitationSchema = SchemaFactory.createForClass(CalendarInvitation);

export type CalendarInvitationDocument = CalendarInvitation & Document;