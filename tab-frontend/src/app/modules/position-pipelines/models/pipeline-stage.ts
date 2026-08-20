import { BaseEntity } from "../../general/models/base-entity";
import { ActionItem } from "./action-items";

export class PipelineStage implements BaseEntity {
  _id?: any;
  positionId: any;
  positionPipelineId: any;
  name: string = '';
  order!: number;
  type!: StageType;
  description?: string;
  actionItems?: ActionItem[] = [];
  icon?: string; 
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