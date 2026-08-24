import { BaseEntity } from "../../general/models/base-entity";
import { TalentNote } from "../../pipeline-board/models/talent-note";
import { STAGES_NAMES } from "../../position-pipelines/models/default-pipeline-stages";
import { StageType } from "../../position-pipelines/models/pipeline-stage";
import { Skill } from "../../skills/models/skill";

export enum RejectionReason {
    NotQualified = 'not_enough_theoretical_knowledge',
    NotSkilled = 'not_enough_practical_skills',
    NotMotivated = 'not_motivated',
    NotCulturalFit = 'not_cultural_fit',
    SalaryExpectation = 'salary_expectation',
    NotSelectedNextStage = 'other'
}

export enum StageStatus {
    passed = 'passed',
    failed = 'failed',
    pending = 'pending',
    future = 'future'
}

export class TalentPipelineProgress implements BaseEntity {
    _id?: any;
    userId?: any;
    positionId: any; 
    positionPipelineId: any;
    talentId: any;
    talentName: string = '';
    stageId: any;
    stageName: string = '';
    stageType!: StageType;
    status!: StageStatus;
    interviewFeedback?: string = '';
    assessmentScore?: number = 1;
    finalDecision?: StageStatus;
    finalRejectionReason?: RejectionReason;
    finalNotes?: string = '';
    notes: string = '';
    relatedEntityId?: any; 
    finalDecisionBy?: any;
    finalDecisionDate?: Date;
    createdBy?: any;
    createdDate?: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}

export interface EnrichedTalentPipelineProgress extends TalentPipelineProgress {
    positionName: string;
    companyName: string;
    companyId: string;
    bookingToken?: string;
    assessmentLinkId?: string;
    assessmentType?: 'test' | 'interview' | 'live-coding';
    createdDate?: Date;
}

export interface EnrichedAppliedPositionsProgress {
    pipelineProgress?: TalentPipelineProgress[];
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

export interface ITalentPipelineStagesGroup {
  talentId: string;
  photoUrl?: string;
  talentNote: TalentNote;
  skills: Skill[];
  stages: string[];
}

export const STAGE_TRANSITIONS: Record<STAGES_NAMES, STAGES_NAMES | null> = {
  [STAGES_NAMES.SOURCED]: STAGES_NAMES.APPLIED,
  [STAGES_NAMES.APPLIED]: STAGES_NAMES.SCREENING,
  [STAGES_NAMES.SCREENING]: STAGES_NAMES.ASSESSMENT,
  [STAGES_NAMES.ASSESSMENT]: STAGES_NAMES.INTERVIEW,
  [STAGES_NAMES.INTERVIEW]: STAGES_NAMES.OFFER,
  [STAGES_NAMES.OFFER]: STAGES_NAMES.HIRED,
  [STAGES_NAMES.HIRED]: null, 
};

export interface StageStatusConfig {
  label: string;
  icon: string;
  colorClass: string;
}

export const STAGE_STATUS_CONFIG: Record<StageStatus, StageStatusConfig> = {
    [StageStatus.passed]: {
        label: 'Passed',
        icon: 'check_circle',
        colorClass: 'status-completed',
    },
    [StageStatus.failed]: {
        label: 'Failed',
        icon: 'cancel',
        colorClass: 'status-failed',
    },
    [StageStatus.pending]: {
        label: 'In progress',
        icon: 'hourglass_top',
        colorClass: 'status-active',
    },
    [StageStatus.future]: {
        label: 'Upcoming',
        icon: 'schedule',
        colorClass: 'status-pending',
    },
};

export interface StageFinalDecisionForm {
  finalDecision?: StageStatus;
  finalRejectionReason?: RejectionReason;
  finalNotes?: string;

  finalDecisionBy?: any;
  finalDecisionDate?: Date;
}

export interface IApplicantsByStage {
  positionId: string;
  positionTitle: string;
  stageType: string;
  stageName: string;
  applicants: IApplicantsByStageItem[];
}

export interface IApplicantsByStageItem {
  positionId?: string;
  positionTitle?: string;
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