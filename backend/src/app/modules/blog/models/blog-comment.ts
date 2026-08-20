
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel, ISharedReadModel, IVerifiableModel } from '../../base/models/base';

@Schema({ collection: 'blog-post-comments' })
@Entity("blog-post-comments")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedReadModel)
export class BlogPostComment implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: false })
    parentId?: ObjectId;

    @Column()
    @Prop({ required: false })
    blogPostId?: ObjectId;

    @Column()
    @Prop({ required: true })
    content: string;

    @Column()
    @Prop({ required: true })
    userName: string;

    // @Column()
    // @Prop({ required: true })
    // path: string;

    // @Column()
    // @Prop({ required: true })
    // quality: string;

    // @Column()
    // @Prop({ required: true })
    // aspectRatio: string;

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
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: Date.now() })
    createdDate: Date = new Date();

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false })
    modifiedDate?: Date;
}

export type BlogPostCommentDocument = BlogPostComment & Document;
export const BlogPostCommentSchema = SchemaFactory.createForClass(BlogPostComment);