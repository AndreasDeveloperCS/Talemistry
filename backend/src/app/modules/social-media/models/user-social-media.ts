import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from '../../base/models/base';

@Schema({ collection: 'user-social-media' })
@Entity("user-social-media")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class UserSocialMedia implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: any;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true, type: ObjectId })
    referenceId?: ObjectId;

    @Column()
    @Prop({ required: false, default: "" })
    name?: string;

    @Column()
    @Prop({ required: false, default: "" })
    icon: string;

    @Column()
    @Prop({ required: false, default: "" })
    site: string;

    @Column()
    @Prop({ required: false, default: "" })
    profileLink?: string;

    @Column()
    @Prop({ required: false, type: ObjectId, default: [] })
    profileLinks?: string[] = [];

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
    @Prop({ required: false })
    modifiedDate?: Date;
}

export type UserSocialMediaDocument = UserSocialMedia & Document;

export const UserSocialMediaSchema = SchemaFactory.createForClass(UserSocialMedia);
