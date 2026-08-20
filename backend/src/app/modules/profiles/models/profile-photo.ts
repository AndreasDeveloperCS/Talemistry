import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedReadModel } from "../../base/models/base";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ObjectId } from "bson";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";

@Schema({ collection: 'profile-photo' })
@Entity("profile-photo")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedReadModel)
export class ProfilePhoto implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    isMain!: boolean;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

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
    sharedReadIds: ObjectId[];

    @Column()
    @Prop({ required: false })
    sharedReadEmails: string[];

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

export type ProfilePhotoDocument = ProfilePhoto & Document;
export const ProfilePhotoSchema = SchemaFactory.createForClass(ProfilePhoto);