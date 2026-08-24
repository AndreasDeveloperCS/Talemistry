import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { STTWord } from "./stt-word";
import { TranslationVariant } from "./translation-variant";

export class TranscriptSegment {
    @Column()
    @Prop({ required: true })
    speakerId: string; // map to participant email or 'S1','S2'

    @Column()
    @Prop({ required: false })
    speakerEmail?: string;

    @Column()
    @Prop({ required: true })
    startMs: number;

    @Column()
    @Prop({ required: true })
    endMs: number;

    @Column()
    @Prop({ required: true })
    text: string;

    @Column()
    @Prop({ required: false, type: [STTWord], default: [] })
    words?: STTWord[];

    // NEW: parallel translations for UX/search
    @Column()
    @Prop({ required: false, type: [TranslationVariant], default: [] })
    translations?: TranslationVariant[];
}
