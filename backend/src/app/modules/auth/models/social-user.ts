import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { IBaseModel } from '../../base/models/base';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';

export type GoogleUserDocument = SocialUser & Document;

@Schema({ collection: 'social-users' })
@Entity("social-users")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated)
export class SocialUser implements IBaseModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    googleId: string;

    @Column()
    @Prop({ required: true })
    email: string;

    @Column()
    @Prop({ required: false })
    name?: string;

    @Column()
    @Prop({ required: false })
    picture?: string;


    @Column()
    @Prop({ required: false })
    createdBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    createdDate?: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false })
    modifiedDate?: Date;
}

export const SocialUserSchema = SchemaFactory.createForClass(SocialUser);