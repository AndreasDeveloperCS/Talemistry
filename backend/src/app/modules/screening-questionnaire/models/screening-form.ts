import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, IVerifiableModel } from "../../base/models/base";

@Schema({ collection: 'screening-forms' })
@Entity("screening-forms")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class ScreeningForm implements IBaseModel, IVerifiableModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

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
    @Prop({ required: true, default: () => new Date() })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: () => new Date() })
    modifiedDate?: Date;
}

export type ScreeningFormDocument = ScreeningForm & Document;

export const ScreeningFormSchema = SchemaFactory.createForClass(ScreeningForm);