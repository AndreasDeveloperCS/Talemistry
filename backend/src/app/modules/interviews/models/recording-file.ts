import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel } from "../../base/models/base";
import { DetectedLanguage } from "./detected-language";

@Schema({ collection: 'recording-file' })
@Entity('recording-file')
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class RecordingFile implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    meetingId: ObjectId;

    @Column()
    @Prop({ required: true })
    storageKey: string; // S3/GCS path or gridfs id

    @Column()
    @Prop({ required: true })
    mimeType: string; // audio/wav, video/mp4

    @Column()
    @Prop({ required: false })
    encoding?: string;

    @Column()
    @Prop({ required: true })
    filename?: string;

    @Column()
    @Prop({ required: true })
    extension?: string;

    @Column()
    @Prop({ required: true })
    Bucket: string;

    @Column()
    @Prop({ required: true })
    Key: string;

    @Column()
    @Prop({ required: true })
    durationMs: number;

    @Column()
    @Prop({ required: false })
    sizeBytes?: number;

    @Column()
    @Prop({ required: false })
    checksum?: string;

    @Column()
    @Prop({ type: [DetectedLanguage], default: [] })
    languages?: DetectedLanguage[];

    @Column()
    @Prop({ required: true })
    sharedReadIds: ObjectId[];

    @Column()
    @Prop({ required: true })
    sharedReadEmails: string[];

    @Column()
    @Prop({ required: true })
    sharedEditIds: ObjectId[];

    @Column()
    @Prop({ required: true })
    sharedEditEmails: string[];

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate: Date;
}