
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IBaseModel, IOwnerModel, IVerifiableModel } from '../../base/models/base';

@Schema({ collection: 'social-media-icon' })
@Entity("social-media-icon")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.OwnerModel)
export class SocialMediaIcon implements IBaseModel, IVerifiableModel, IAuditCreated, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false, default: "" })
    imagePath?: string;

    @Column()
    @Prop({ required: false, default: "" })
    Location: string;

    @Column()
    @Prop({ required: false, default: "" })
    ETag: string;

    @Column()
    @Prop({ required: false, default: "" })
    Bucket: string;

    @Column()
    @Prop({ required: false, default: "" })
    Key: string;

    @Column()
    @Prop({ required: false, default: "" })
    presignedUrl: string;

    @Column()
    @Prop({ required: false, default: "" })
    originalName?: string;

    @Column()
    @Prop({ required: false })
    mimetype?: string;

    @Column()
    @Prop({ required: false })
    size?: number;

    @Column()
    @Prop({ required: false })
    isVerified: boolean;

    @Column()
    @Prop({ required: false })
    userId: ObjectId;

    @Column()
    @Prop({ required: false })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: Date.now() })
    createdDate: Date = new Date();
}

export type SocialMediaIconDocument = SocialMediaIcon & Document;
export const SocialMediaIconSchema = SchemaFactory.createForClass(SocialMediaIcon);