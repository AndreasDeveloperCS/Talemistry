import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel, IVerifiableModel } from "../../base/models/base";

import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { CompanyData } from "./company-data";

@Schema({ collection: 'company-versions' })
@Entity("company-versions")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.OwnerModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class CompanyVersion implements IBaseModel, IVerifiableModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true, type: ObjectId })
    userId: ObjectId;

    @Column()
    @Prop({ required: false })
    companyId?: ObjectId;

    @Column()
    @Prop({ required: true, default: 1 })
    version: number;

    @Column()
    @Prop({ required: false, default: false })
    isVerified: boolean = false;

    @Column()
    @Prop({ required: true, type: CompanyData })
    data: CompanyData = new CompanyData();

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

export type CompanyVersionDocument = CompanyVersion & Document;

export const CompanyVersionSchema = SchemaFactory.createForClass(CompanyVersion);