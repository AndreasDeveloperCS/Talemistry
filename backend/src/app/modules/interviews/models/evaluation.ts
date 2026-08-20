import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { RubricCriterion } from "./rubric-criterion";
import { QAItem } from "./qa-item";

export class Evaluation {
    @Column()
    @Prop({ required: false, type: [RubricCriterion], default: [] })
    rubric?: RubricCriterion[];

    @Column()
    @Prop({ required: false })
    totalScore?: number; // 0..100

    @Column()
    @Prop({ required: false })
    verdict?: 'strongYes' | 'yes' | 'weakYes' | 'no' | 'strongNo';

    @Column()
    @Prop({ required: false })
    summaryNotes?: string;

    @Column()
    @Prop({ required: false, type: [QAItem], default: [] })
    qa?: QAItem[];
}
