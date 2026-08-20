import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IVerifiableModel } from '../../base/models/base';

@Schema({ collection: 'social-media' })
@Entity("social-media")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class SocialMedia implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false, default: "" })
    name?: string;

    @Column()
    @Prop({ required: false, default: "" })
    icon?: string;

    @Column()
    @Prop({ required: false, default: "" })
    relativePath?: string;

    @Column()
    @Prop({ required: false, default: "" })
    absolutePath?: string;

    @Column()
    @Prop({ required: false, default: "" })
    cloudPath?: string;

    @Column()
    @Prop({ required: false, default: "" })
    Bucket: string = '';

    @Column()
    @Prop({ required: false, default: "" })
    imagePath: string = '';

    @Column()
    @Prop({ required: false, default: "" })
    Key: string = '';

    @Column()
    @Prop({ required: false, default: "" })
    mainUrl: string;

    @Column()
    @Prop({ required: false, default: 1 })
    priority?: number;

    @Column()
    @Prop({ required: true, default: true })
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
    @Prop({ required: false })
    modifiedDate?: Date;
}

export const SocialMediaSchema = SchemaFactory.createForClass(SocialMedia);

export type SocialMediaDocument = SocialMedia & Document;
