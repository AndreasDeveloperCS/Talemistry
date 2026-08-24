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