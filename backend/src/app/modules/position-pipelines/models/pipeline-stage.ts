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

export enum StageType {
  CV_REVIEW = 'cv_review',
  SCREENING = 'screening',
  ASSESSMENT = 'assessment',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  FINAL = 'final',
  DEFAULT = 'default'
}

@Schema({ collection: 'pipeline_stages' })
@Entity('pipeline_stages')
@Implements(INTERFACES.BaseModel)
export class PipelineStage implements IBaseModel {

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

    @Column()
    @Prop({ required: true })
    type: StageType; 

    @Column({ nullable: true })
    @Prop({ required: false })
    description: string;

    @Column({ nullable: true })
    @Prop({ required: false })
    actionItems: ActionItem[] = [];

    @Column({ nullable: true })
    @Prop({ required: false })
    icon: string;
}

export const PipelineStageSchema = SchemaFactory.createForClass(PipelineStage);

export type PipelineStageDocument = PipelineStage & Document;