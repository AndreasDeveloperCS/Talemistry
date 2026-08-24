import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";


export class QAItem {
    @Column()
    @Prop({ required: true })
    question: string;

    @Column()
    @Prop({ required: false })
    expectedSignals?: string[]; // target skills

    @Column()
    @Prop({ required: false })
    answer?: string;

    @Column()
    @Prop({ required: false })
    score?: number; // 0..100
}