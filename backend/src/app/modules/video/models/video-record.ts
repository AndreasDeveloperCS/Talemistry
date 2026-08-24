import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";

export interface ChunkPayload {
    recordingId: string;
    chunkIndex: number;
    buffer: Buffer;
    isLast: boolean;
    interviewId?: string;
    userId: ObjectId;
}

@Schema({ collection: 'video-records' })
@Entity("video-records")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class VideoRecord implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

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
    @Prop({ required: false, default: new Date(Date.now()) })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate: Date;
}

export type VideoRecordDocument = VideoRecord & Document;

export const VideoRecordSchema = SchemaFactory.createForClass(VideoRecord);
