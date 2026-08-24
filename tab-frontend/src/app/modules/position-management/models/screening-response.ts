import { BaseEntity } from "../../general/models/base-entity";
import { QuestionType } from "./screening-question";

export class ScreeningResponse implements BaseEntity {
  _id?: any;
  formId: any; 
  positionId: any;
  talentId: any; 
  answers: ScreeningSingleAnswer[] = [];
  userId: any;
  score?: number;
  createdBy: any;
  createdDate: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date = new Date();
}

export class ScreeningSingleAnswer {
  questionId: any;
  questionText: string = '';   // snapshot for historical integrity
  questionType?: QuestionType;
  value?: any;
  video?: ScreeningVideoAnswerInfo;
}

export class ScreeningVideoAnswerInfo {
  durationInSeconds?: number;
  videoSource?: string;
}