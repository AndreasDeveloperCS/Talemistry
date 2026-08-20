import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";

export class SentimentPoint {
    @Column()
    @Prop({ required: true })
    tsMs: number;

    @Column()
    @Prop({ required: true })
    score: number; // -1..1
}

export class EntityMention {
    @Column()
    @Prop({ required: true })
    text: string;

    @Column()
    @Prop({ required: true })
    type: string; // PERSON, ORG, TECH_SKILL, etc.

    @Column()
    @Prop({ required: false })
    count?: number;
}
