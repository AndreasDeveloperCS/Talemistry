import { PositionDetails } from "../../positions/models/position-details";

export interface IAppliedPosition {
    positionId: any;
    positionTitle: string;
    appliedDate: Date;
    positionDetails: PositionDetails;
    currentStage: string;
    currentStageStatus: string;
}