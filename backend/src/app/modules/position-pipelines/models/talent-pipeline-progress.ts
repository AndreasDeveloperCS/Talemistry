import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from '../../base/models/base';
import { Skill } from '../../skills/models/skill';
import { RejectionReason, StageStatus } from '../types/pipeline.types';
import { StageType } from './pipeline-stage';
import { TalentNote } from './talent-note';

@Schema({ collection: 'talent-pipeline-progress' })
@Entity('talent-pipeline-progress')
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.OwnerModel, INTERFACES.AuditModified)
export class TalentPipelineProgress implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true, type: ObjectId })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

    @Column()
    @Prop({ required: true })
    talentId: ObjectId;

    @Column()
    @Prop({ required: true })
    talentName: string;

    @Column()
    @Prop({ required: true })
    positionPipelineId: ObjectId;

    @Column()
    @Prop({ required: true })
    stageId: ObjectId;

    @Column()
    @Prop({ required: true })
    stageName: string;

    @Column()
    @Prop({ required: true })
    stageType: StageType;

    @Column()
    @Prop({ required: true })
    status: StageStatus;

    @Column({ nullable: true })
    @Prop({ required: false })
    interviewFeedback?: string;

    @Column({ nullable: true })
    @Prop({ required: false })
    notes?: string = '';

    @Column({ nullable: true })
    @Prop({ required: false })
    assessmentScore?: number;

    @Column()
    @Prop({ required: false })
    finalDecision?: StageStatus;

    @Column({ nullable: true })
    @Prop({ required: false })
    finalRejectionReason?: RejectionReason;
    
    @Column({ nullable: true })
    @Prop({ required: false })
    finalNotes?: string = '';

    @Column()
    @Prop({ required: false })
    relatedEntityId?: string;

    @Column()
    @Prop({ required: false })
    finalDecisionBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    finalDecisionDate?: Date;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate?: Date;
}

export const TalentPipelineProgressSchema = SchemaFactory.createForClass(TalentPipelineProgress);

export type TalentPipelineProgressDocument = TalentPipelineProgress & Document;

export interface EnrichedTalentPipelineProgress extends TalentPipelineProgress {
    positionName: string;
    companyName: string;
    companyId: string;
}

export interface EnrichedAppliedPositionsProgress {
    positionName: string;
    positionId: string;
    positionStatus: any;
    positionOwner: string;
    appliedDate: Date;
    companyName: string;
    companyId: string;
    currentStage: string;
    currentStageType: StageType;
    currentStageStatus: string;
}

export interface ITalentPipelineProgressGroup {
    talentId: string;
    photoUrl?: string;
    talentNote: TalentNote;
    skills: Skill[];
    records: EnrichedTalentPipelineProgress[];
}

// Lightweight version of the above interface, used for notifications where we don't need the full pipeline progress history
export interface ITalentPipelineStagesGroup {
  talentId: string;
  photoUrl?: string;
  talentNote: TalentNote;
  skills: Skill[];
  stages: string[]; 
}

export interface IApplicantsByStage {
  positionId: string;
  positionTitle: string;
  stageType: string;
  stageName: string;
  applicants: IApplicantsByStageItem[];
}

export interface IApplicantsByStageItem {
  talentId: string;
  talentName: string;
  photoUrl?: string;

  finalDecision?: string;
  assessmentScore?: number;

  latestProgressId: string;
  latestModifiedDate?: Date;

  skills?: any[];
  talentNote?: any;
}

export interface IApplicantsByStageGlobal {
    stageType: string;
    stageName: string;
    applicants: IApplicantsByStageGlobalItem[];
}

export interface IApplicantsByStageGlobalItem {
    positionId: string;
    positionTitle: string;

    talentId: string;
    talentName: string;

    photoUrl?: string;

    finalDecision?: string;
    assessmentScore?: number;

    latestProgressId: string;
    latestModifiedDate?: Date;

    skills?: any[];
    talentNote?: any;
}