import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";

export class TranslationVariant {
    @Column()
    @Prop({ required: true })
    lang: string;        // BCP-47

    @Column()
    @Prop({ required: true })
    text: string;

    @Column()
    @Prop({ required: false })
    provider?: string;   // e.g., "gpt-4o-mini-trans", "google-translate"

    @Column()
    @Prop({ required: false })
    qualityScore?: number; // 0..1 or BLEU-ish proxy
}
