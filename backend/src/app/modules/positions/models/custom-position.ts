import { JobResponsibilities, PositionBenefits, PositionDetails, PositionItem, PositionRequirement, PositionSummary, ProjectDescription } from "./position-item";

export interface ICustomPosition {

  title: string;

  titleCode: string;

  positionDetails: PositionDetails;

  projectDescription: ProjectDescription;

  jobResponsibilities: JobResponsibilities;

  requirements: PositionRequirement;

  benefits: PositionBenefits;

  summary: PositionSummary;

  positionElements: PositionItem[];
}