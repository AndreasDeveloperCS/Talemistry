import { BaseEntity } from "../../general/models/base-entity";

export class TalentNote implements BaseEntity {
  _id?: any;
  talentId: any;
  positionId: any;
  stageId?: any; // optional (general vs stage-specific)
  text!: string;
  visibility: TalentNoteVisibility = TalentNoteVisibility.PRIVATE;
  userId?: any;
  createdBy?: any;
  createdDate: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date = new Date();
}

export enum TalentNoteVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
}