import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Column } from "typeorm";
import { EntityMention, SentimentPoint } from "./sentiments";
import { Evaluation } from "./evaluation";
import { ActionItem } from "./action-item";
import { Schema as MSchema } from 'mongoose';

@Schema({ _id: false })
export class SkillScore {
    @Prop({ required: true }) key: string;     // e.g., "SystemDesign"
    @Prop({ required: true }) score: number;   // 0..100
    @Prop({ required: false }) weight?: number;// 0..1
}

@Schema({ _id: false })
export class SkillsMatrix {
    @Prop({ required: false, type: [SkillScore], default: [] })
    scores?: SkillScore[];

    @Prop({ required: false })
    notes?: string;
}

export const SkillsMatrixSchema = SchemaFactory.createForClass(SkillsMatrix);



export class AIInsight {
    @Column()
    @Prop({ required: false, type: [EntityMention], default: [] })
    entities?: EntityMention[];

    @Column()
    @Prop({ required: false, type: [SentimentPoint], default: [] })
    sentimentTimeline?: SentimentPoint[];

    @Column()
    @Prop({ required: false, type: [ActionItem], default: [] })
    actions?: ActionItem[];

    @Column()
    @Prop({ required: false })
    topicsSummary?: string;

    @Column()
    @Prop({ required: false, type: MSchema.Types.Mixed })
    skillsMatrixJson?: Record<string, SkillScore>; // or unknown

    // @Prop({ required: false, type: SkillsMatrix })
    // skillsMatrixJson?: SkillsMatrix;

    @Column()
    @Prop({ required: false, type: Evaluation })
    evaluation?: Evaluation;

    @Column()
    @Prop({ required: false })
    modelUsed?: string; // e.g., "gpt-4.1", "local-llm-vX"

    @Column()
    @Prop({ required: false })
    promptVersion?: string;

    @Column()
    @Prop({ required: false })
    generatedAt?: Date;
}

