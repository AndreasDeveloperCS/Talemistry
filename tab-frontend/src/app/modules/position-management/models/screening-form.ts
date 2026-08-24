import { BaseEntity } from "../../general/models/base-entity";
import { ScreeningQuestion } from "./screening-question";

export class ScreeningForm implements BaseEntity {
  _id?: any;
  positionId: any; 
  isVerified?: boolean = true;
  userId: any;
  createdBy: any;
  createdDate: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date = new Date();

  questions?: ScreeningQuestion[];
}

export interface IScreeningForm extends ScreeningForm {
  questions: ScreeningQuestion[];
}