import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { STTMetadata } from "./stt-metadata";
import { TranscriptSegment } from "./transcript-segment";
import { DetectedLanguage } from "./detected-language";
import { TranslationVariant } from "./translation-variant";

export class Transcript {
    @Column()
    @Prop({ required: true, type: STTMetadata })
    meta: STTMetadata;

    // Optionally summarize what languages appear across segments
    @Column()
    @Prop({ required: false, type: [DetectedLanguage], default: [] })
    languages?: DetectedLanguage[];

    @Column()
    @Prop({ required: true, type: [TranscriptSegment], default: [] })
    segments: TranscriptSegment[];

    // Optional: convenience fields
    @Column()
    @Prop({ required: false })
    fullText?: string;              // concatenated original

    // NEW: prebuilt translations of the whole meeting
    @Column()
    @Prop({ required: false, type: [TranslationVariant], default: [] })
    fullTextTranslations?: TranslationVariant[];
}
