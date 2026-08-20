import { BaseEntity } from "../../general/models/base-entity";
import { PipelineStage } from "./pipeline-stage";

export class PositionPipeline implements BaseEntity {
  _id: any;
  positionId: any;
  stages: PipelineStage[] | any = [];
  userId?: any;
  createdBy?: any;
  createdDate?: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date;
}