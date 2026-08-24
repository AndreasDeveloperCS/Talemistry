import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectId } from 'bson';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedEditModel, ISharedModel, IVerifiableModel } from '../../base/models/base';
import { BlogImage } from './blog-image';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';


@Schema({ collection: 'blog-post' })
@Entity("blog-post")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedModel, INTERFACES.SharedEditModel, INTERFACES.SharedIdsReadModel)
export class BlogPost implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false, type: ObjectId })
    internalId?: any;

    @Column()
    @Prop({ required: false, default: "" })
    title?: string;

    @Column()
    @Prop({ required: false, default: "" })
    content: string;

    @Column()
    @Prop({ required: false, default: "" })
    author?: string;

    @Column()
    @Prop({ required: false, default: false })
    isPublished?: boolean;

    @Column()
    @Prop({ required: true, default: false })
    isVerified: boolean = false;

    @Column()
    @Prop({ required: false })
    images?: BlogImage[];

    @Column("simple-array")
    @Prop({ required: false })
    hashtags: string[];

    @Column()
    @Prop({ required: false })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    sharedReadIds: ObjectId[] = [];

    @Column()
    @Prop({ required: true })
    sharedReadEmails: string[] = [];

    @Column()
    @Prop({ required: true })
    sharedEditIds: ObjectId[] = [];

    @Column()
    @Prop({ required: true })
    sharedEditEmails: string[] = [];

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: Date.now() })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: Date.now() })
    modifiedDate?: Date;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);

export type BlogPostDocument = BlogPost & Document;
