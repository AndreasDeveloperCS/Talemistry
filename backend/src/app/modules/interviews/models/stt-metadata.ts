import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { STTProvider } from "./stt-provider";

export class STTMetadata {
    @Column()
    @Prop({ required: true })
    provider: STTProvider;

    @Column()
    @Prop({ required: false })
    model?: string; // e.g., whisper-large-v3

    @Column()
    @Prop({ required: false })
    latencyMs?: number;

    @Column()
    @Prop({ required: false })
    transcriptConfidenceAvg?: number;
}
