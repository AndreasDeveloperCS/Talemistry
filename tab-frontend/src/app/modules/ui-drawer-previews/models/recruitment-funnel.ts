import { StageType } from "../../position-pipelines/models/pipeline-stage";
import { PositionStatus } from "../../positions/models/position-details";

export interface RecruitmentFunnel {
    positionId: string;
    positionTitle: string;
    positionStatus: PositionStatus;
    applicantsCount: number;
    pipelineStagesInfo: RecruitmentPipelineStageInfo[];
}

export interface RecruitmentPipelineStageInfo {
    stageId: string;
    stageName: string;
    stageType: StageType;
    candidatesCount: number;
    order: number;
}

export interface FunnelStage {
    name: string;
    value: number;
    type: StageType;
    color: string;
}