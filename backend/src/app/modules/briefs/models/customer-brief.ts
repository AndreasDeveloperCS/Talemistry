
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from "bson";
import { Column, Entity } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IOwnerModel, ISharedModel } from "../../base/models/base";
import { IBriefCustomerQuestion } from "./brief-question";
import { Brief } from './brief';
import { IBriefCustomerSection } from './brief-customer-section';

@Schema({ collection: 'brief' })
@Entity("brief")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedModel)
export class CustomerBrief extends Brief implements IOwnerModel, ISharedModel {

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: false })
    accessToken: string = '';

    @Column()
    @Prop({ required: false })
    briefSections?: IBriefCustomerSection[] = [];

    @Column()
    @Prop({ required: false, type: Array })
    questions?: IBriefCustomerQuestion[];

    @Column()
    @Prop({ required: false })
    sharedReadIds: ObjectId[] = [];

    @Column()
    @Prop({ required: false })
    sharedReadEmails: string[] = [];

    @Column()
    @Prop({ required: false })
    sharedEditIds: ObjectId[] = [];

    @Column()
    @Prop({ required: false })
    sharedEditEmails: string[] = [];
}

export type CustomerBriefDocument = CustomerBrief & Document;

export const CustomerBriefSchema = SchemaFactory.createForClass(CustomerBrief);