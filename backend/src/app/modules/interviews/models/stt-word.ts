import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { STTProvider } from "./stt-provider";

export class STTWord {
    @Column()
    @Prop({ required: true })
    word: string;

    @Column()
    @Prop({ required: true })
    startMs: number;

    @Column()
    @Prop({ required: true })
    endMs: number;

    @Column()
    @Prop({ required: false })
    confidence?: number; // 0..1
}
