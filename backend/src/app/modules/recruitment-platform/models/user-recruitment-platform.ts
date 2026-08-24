import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IBaseModel } from '../../base/models/base';


@Schema({ collection: 'user-recruitment-platforms' })
@Entity("user-recruitment-platforms")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class UserRecruitmentPlatform implements IBaseModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false })
    userId?: ObjectId;

    @Column()
    @Prop({ required: false })
    rpId?: ObjectId;

    @Column()
    @Prop({ required: false, default: "" })
    name?: string;

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
    @Prop({ required: false, default: "" })
    code: string;

    @Column()
    @Prop({ required: false, default: 1 })
    priority?: number;

    @Column()
    @Prop({ required: false, default: true })
    isVerified?: boolean;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    dateTimeAdded?: Date = new Date();

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    dateTimeModified?: Date = new Date();

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    expirationTokenDate?: Date = new Date();
}

export const UserRecruitmentPlatformSchema = SchemaFactory.createForClass(UserRecruitmentPlatform);

export type UserRecruitmentPlatformDocument = UserRecruitmentPlatform & Document;
