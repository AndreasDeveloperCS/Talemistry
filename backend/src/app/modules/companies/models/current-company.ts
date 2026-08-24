import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { PaymentSubscriptionState } from "../../payments/dto/payments.dto";

@Schema({ collection: 'current-company' })
@Entity("current-company")
@Implements(INTERFACES.BaseModel, INTERFACES.OwnerModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class CurrentCompany implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true, type: ObjectId })
    userId: ObjectId;

    @Column()
    @Prop({ required: false })
    companyId?: ObjectId;

    @Column('simple-json', { nullable: true })
    @Prop({ required: false, type: Object })
    billing?: PaymentSubscriptionState;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();

    @Column()
    @Prop({ required: false })
    modifiedDate?: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;
}

export type CurrentCompanyDocument = CurrentCompany & Document;

export const CurrentCompanySchema = SchemaFactory.createForClass(CurrentCompany);