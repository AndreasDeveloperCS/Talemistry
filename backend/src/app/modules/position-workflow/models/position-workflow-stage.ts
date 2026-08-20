import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IBaseModel } from '../../base/models/base';

export enum ActionItem {
    ScreeningCalendarInvitiation,
    InterviewCalendarInvitiation,
    TechAssessmentTaskLink,
    SoftSkillsAssessmentLink,
    LanguageAssessmentLink,
    Offer,
}

@Schema({ collection: 'pipeline_stages' })
@Entity('pipeline_stages')
@Implements(INTERFACES.BaseModel)
export class PositionWorkflowStage implements IBaseModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId; // Reference to Position

    @Column()
    @Prop({ required: true })
    positionPipelineId: ObjectId;

    @Column()
    @Prop({ required: true })
    name: string; // e.g., Screening, Technical Interview

    @Column()
    @Prop({ required: true })
    order: number; // Stage order

    @Column({ nullable: true })
    @Prop({ required: false })
    description: string;

    @Column({ nullable: true })
    @Prop({ required: false })
    actionItems: ActionItem[] = [];
}

export const PositionWorkflowStageSchema = SchemaFactory.createForClass(PositionWorkflowStage);

export type PositionWorkflowStageDocument = PositionWorkflowStage & Document;