import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";

export class DetectedLanguage {
    @Column()
    @Prop({ required: true })
    tag: string;             // BCP-47

    @Column()
    @Prop({ required: false })
    confidence?: number;     // 0..1

    @Column()
    @Prop({ required: false })
    percent?: number;        // portion of content, 0..100
}