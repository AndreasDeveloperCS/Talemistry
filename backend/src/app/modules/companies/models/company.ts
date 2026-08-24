import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel, IVerifiableModel } from "../../base/models/base";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { CompanyData } from "./company-data";

export interface CompanyPhotoGalleryItem {
    id: string;
    key: string;
    url: string;
    originalName?: string;
    mimetype?: string;
    size?: number;
    caption?: string;
    order?: number;
    createdDate?: Date;
    createdBy?: ObjectId;
}

@Schema({ collection: 'company' })
@Entity("company")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedModel)
export class Company implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false })
    companyVersionId: ObjectId;

    @Column()
    @Prop({ required: true, type: CompanyData })
    data: CompanyData = new CompanyData();

    @Column()
    @Prop({ required: false, default: false })
    isVerified: boolean = false;

    @Column()
    @Prop({ required: false, type: ObjectId })
    userId?: ObjectId;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: false, type: [ObjectId], default: [] })
    sharedReadIds?: ObjectId[] = [];

    @Column()
    @Prop({ required: false, type: [ObjectId], default: [] })
    sharedEditIds?: ObjectId[] = [];

    @Column()
    @Prop({ required: false, type: [String], default: [] })
    sharedReadEmails?: string[] = [];

    @Column()
    @Prop({ required: false, type: [String], default: [] })
    sharedEditEmails?: string[] = [];

    @Column()
    @Prop({ required: false, type: Array, default: [] })
    photoGallery?: CompanyPhotoGalleryItem[] = [];

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();

    @Column()
    @Prop({ required: false })
    modifiedDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy: ObjectId;
}

export type CompanyDocument = Company & Document;

export const CompanySchema = SchemaFactory.createForClass(Company);