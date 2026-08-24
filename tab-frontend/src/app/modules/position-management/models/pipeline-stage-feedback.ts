import { BaseEntity } from "../../general/models/base-entity";
import { RejectionReason, StageStatus } from "./talent-pipeline-progress";
import { StageType } from "../../position-pipelines/models/pipeline-stage";

export enum FeedbackSource {
  AI = 'ai',
  EXPERT = 'expert',
  INTERVIEWER = 'interviewer',
  HR = 'hr'
}

export enum FeedbackStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  FINAL = 'final'
}

export class PipelineStageFeedback implements BaseEntity {
  _id?: any;
  pipelineProgressId: any;
  talentId: any;      
  positionId: any;
  stageId: any;
  stageType!: StageType;
  source!: FeedbackSource;
  status!: FeedbackStatus;
  payload!: StageFeedbackPayload;
  userId?: any;
  createdBy?: any;
  createdDate?: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date;
}

export interface BaseFeedbackPayload {
  score?: number;
  recommendation?: StageStatus;   
  rejectionReason?: RejectionReason; 
}

export interface CvReviewFeedbackPayload extends BaseFeedbackPayload {
  comments?: string;
}

export interface ScreeningFeedbackPayload extends BaseFeedbackPayload {
  screeningResponseId: any;           
  normalizedScore?: number;           
  notes?: string;
}

export interface InterviewFeedbackPayload extends BaseFeedbackPayload {
  technicalScore?: number;
  softSkillsScore?: number;
  cultureFitScore?: number;
  strengths?: string;
  weaknesses?: string;
}

export interface AssessmentFeedbackPayload extends BaseFeedbackPayload {
  score: number;
  maxScore: number;
  notes?: string;
}

export type StageFeedbackPayload =
  | CvReviewFeedbackPayload
  | InterviewFeedbackPayload
  | AssessmentFeedbackPayload
  | ScreeningFeedbackPayload;