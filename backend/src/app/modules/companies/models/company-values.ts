import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IVerifiableModel } from "../../base/models/base";

@Schema({ collection: 'company-values' })
@Entity("company-values")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class CompanyValue implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    value: string = '';

    @Column()
    @Prop({ required: false })
    subgroups?: any[] = [];

    @Column()
    @Prop({ required: true, default: true })
    isVerified: boolean = true;

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

export type CompanyValueDocument = CompanyValue & Document;

export const CompanyValueSchema = SchemaFactory.createForClass(CompanyValue);

CompanyValueSchema.index(
    { value: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
);