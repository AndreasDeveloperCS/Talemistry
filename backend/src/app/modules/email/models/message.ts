import { ObjectId } from "bson";
import { IAuditCreated, IBaseModel, IOwnerModel } from "../../base/models/base";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { FileInfo } from "../../cvs/models/file-info";

export class MessageAttachment {
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
    file?: FileInfo;
}

@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.OwnerModel)
export class Message implements IBaseModel, IAuditCreated, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    subject: string;

    @Column()
    @Prop({ required: true })
    messageBody: string;

    // Full Fill With MessageAttachment[]
    @Column()
    @Prop({ required: false })
    attachments?: MessageAttachment[] = [];

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    sentAt: Date;

    @Column()
    @Prop({ required: false })
    receivedAt?: Date;

    @Column()
    @Prop({ required: true })
    status: string;

    @Column()
    @Prop({ required: false })
    errorMessage?: string;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();
}

@Schema({ collection: 'email-messages' })
@Entity('email-messages')
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class EmailMessage extends Message {

    @Column()
    @Prop({ required: false })
    to: string;

    @Column()
    @Prop({ required: false })
    cc?: string;

    @Column()
    @Prop({ required: false })
    bcc?: string;

    @Column()
    @Prop({ required: false })
    from: string;

    @Column()
    @Prop({ required: false })
    replyTo?: string;
}

export const EmailMessageSchema = SchemaFactory.createForClass(EmailMessage);

export type EmailMessageDocument = EmailMessage & Document;