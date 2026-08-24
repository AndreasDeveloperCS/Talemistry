import { EnrichedTalentPipelineProgress } from "../../position-management/models/talent-pipeline-progress";
import { STAGES_NAMES } from "../../position-pipelines/models/default-pipeline-stages";

export interface NextStageDialogResult {
  confirmed: boolean;
  bookingToken?: string;
  screeningId?: string;
  assessment?: {
    type: AssessmentType;
    linkId?: any;
  };
}

export interface NextStageDialogData {
  stage: STAGES_NAMES;
  candidate: EnrichedTalentPipelineProgress;
  positionId: string;
  positionTitle: string;
}

export enum AssessmentType {
  TEST = 'test',
  INTERVIEW = 'interview',
  LIVE_CODING = 'live-coding',
}