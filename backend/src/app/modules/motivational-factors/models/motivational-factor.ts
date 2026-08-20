import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IVerifiableModel } from "../../base/models/base";

export enum IntensityLevel {
    VeryLow = 'Very Low',
    Low = 'Low',
    Lower = 'Lower',
    Normal = 'Normal',
    Higher = 'Higher',
    Strong = 'Strong',
    VeryHigh = 'Very High'
}

@Schema({ collection: 'motivational-factors' })
@Entity("motivational-factors")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class MotivationalFactor implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    factor: string = '';

    @Column()
    @Prop({ required: false })
    subgroups?: any[] = [];

    @Column()
    @Prop({ required: false })
    influenceStrength: IntensityLevel = IntensityLevel.Normal;

    @Column()
    @Prop({ required: false, default: true })
    isVerified: boolean;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate?: Date;
}

export type MotivationalFactorDocument = MotivationalFactor & Document;

export const MotivationalFactorSchema = SchemaFactory.createForClass(MotivationalFactor);