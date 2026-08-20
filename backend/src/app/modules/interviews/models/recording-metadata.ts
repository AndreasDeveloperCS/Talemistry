import { Prop } from "@nestjs/mongoose";
import { RecordingFile } from "./recording-file";
import { Column } from "typeorm";
import { RecordingSource } from "./recording-source";

export class RecordingMetadata {
    @Column()
    @Prop({ required: true })
    source: RecordingSource = RecordingSource.Native;

    @Column()
    @Prop({ required: true })
    isRecordingEnabled: boolean;

    @Column()
    @Prop({ required: true })
    participantConsent: boolean;

    @Column()
    @Prop({ required: false })
    consentCapturedAt?: Date;

    @Column()
    @Prop({ required: false })
    primaryLanguage?: string; // e.g., UI hint for captions, default ASR

    @Column()
    @Prop({ required: false, type: [RecordingFile], default: [] })
    files?: RecordingFile[];
}