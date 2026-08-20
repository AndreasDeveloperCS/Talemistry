import { StageType } from "../../position-pipelines/models/pipeline-stage";
import { RejectionReason, StageStatus, TalentPipelineProgress } from "./talent-pipeline-progress";

export interface ApplicantStage extends TalentPipelineProgress {
  _id?: string;
  stageId: string;             
  stageName: string;  
  stageType: StageType;         
  name: string;                 
  icon?: string;                
  order: number;
  description?: string;
  createdDate?: Date;
  assessmentScore?: number;
  status: StageStatus;
  positionId: string;
  positionPipelineId: string;
  finalDecision?: StageStatus;
  finalRejectionReason?: RejectionReason;
  finalNotes?: string;
  notes: string;
  talentId: string;
  talentName: string;
  companyId?: string;
  companyName?: string;
  userId?: string;
}

export interface Applicant {
  talentId: string;
  shortTalentId?: string;
  talentName: string;
  photoUrl?: string;
  overallScore?: number;
  createdDate?: string | Date;
  stages: ApplicantStage[];
}