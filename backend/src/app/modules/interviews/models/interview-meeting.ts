import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity } from "typeorm";
import { Meeting } from "../../meetings/model/meeting";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { ChatAttachment } from "./chat-attachment";
import { RecordingMetadata } from "./recording-metadata";
import { Transcript } from "./transcript";
import { ChatThread } from "./chat-thread";
import { AIInsight } from "./ai-insight";

@Schema({ collection: 'interview-meetings' })
@Entity('interview-meetings')
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class InterviewMeeting extends Meeting {

    @Column()
    @Prop({ required: true })
    positionPipelineId: ObjectId;

    @Column()
    @Prop({ required: true })
    positionStageId: ObjectId;

    // NEW: recording + consent
    @Column()
    @Prop({ required: false, type: RecordingMetadata })
    recording?: RecordingMetadata;

    // REPLACES: speechToText: any
    @Column()
    @Prop({ required: false, type: Transcript })
    speechToText?: Transcript;

    @Column()
    @Prop({ required: false, type: [ChatThread], default: [] })
    chatCommunication?: ChatThread[];

    // NLP insights (optional but powerful)
    @Column()
    @Prop({ required: false, type: AIInsight })
    insights?: AIInsight;

    @Column({ nullable: true })
    @Prop({ required: false })
    description?: string;

    // Useful foreign keys / denormalized info
    @Column()
    @Prop({ required: false })
    candidateUserId?: ObjectId;

    @Column()
    @Prop({ required: false })
    candidateEmail?: string;

    // Link files (CV, portfolio, code samples)
    @Column()
    @Prop({ required: false, type: [ChatAttachment], default: [] })
    attachments?: ChatAttachment[];
}

export const InterviewMeetingSchema = SchemaFactory.createForClass(InterviewMeeting);

export type InterviewMeetingDocument = InterviewMeeting & Document;