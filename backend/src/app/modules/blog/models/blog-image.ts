
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectId } from 'bson';
import { IAuditCreated, IBaseModel, IOwnerModel, ISharedModel, IVerifiableModel } from '../../base/models/base';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';


@Schema({ collection: 'blog-image' })
@Entity("blog-image")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.OwnerModel, INTERFACES.SharedModel)
export class BlogImage implements IBaseModel, IVerifiableModel, IAuditCreated, IOwnerModel, ISharedModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    internalBlogId!: ObjectId;

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
    @Prop({ required: true })
    sharedReadIds: ObjectId[] = [];

    @Column()
    @Prop({ required: false })
    sharedReadEmails: string[] = [];

    @Column()
    @Prop({ required: false })
    sharedEditIds: ObjectId[] = [];

    @Column()
    @Prop({ required: false })
    sharedEditEmails: string[] = [];

    @Column()
    @Prop({ required: false })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: Date.now() })
    createdDate: Date = new Date();
}

export type BlogImageDocument = BlogImage & Document;
export const BlogImageSchema = SchemaFactory.createForClass(BlogImage);
