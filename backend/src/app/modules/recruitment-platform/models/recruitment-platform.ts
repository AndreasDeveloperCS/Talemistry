import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, IVerifiableModel } from '../../base/models/base';
import { FileInfo } from '../../cvs/models/file-info';


@Schema({ collection: 'recruitment-platforms' })
@Entity("recruitment-platforms")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class RecruitmentPlatform implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false })
    userId: ObjectId;

    @Column()
    @Prop({ required: false, default: "" })
    name?: string;

    @Column()
    @Prop({ required: false, default: "" })
    icon: string;

    @Column()
    @Prop({ required: false, default: "" })
    iconInfo: FileInfo;

    @Column()
    @Prop({ required: false, default: "" })
    additionalInfo: string;

    @Column()
    @Prop({ required: false, default: "" })
    cloudPath?: string;

    @Column()
    @Prop({ required: false, default: "" })
    site: string;

    @Column()
    @Prop({ required: false, default: "" })
    apiUrl: string;

    @Column()
    @Prop({ required: false, default: "" })
    clientId: string;

    @Column()
    @Prop({ required: false, default: "" })
    clientSecret: string;

    @Column()
    @Prop({ required: false, default: "" })
    accessToken: string;

    @Column()
    @Prop({ required: false, default: 1 })
    priority?: number;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    expirationTokenDate?: Date = new Date();

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

export const RecruitmentPlatformSchema = SchemaFactory.createForClass(RecruitmentPlatform);

export type RecruitmentPlatformDocument = RecruitmentPlatform & Document;
