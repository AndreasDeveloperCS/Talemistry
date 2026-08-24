import { BaseEntity } from "../../general/models/base-entity";

export enum QuestionType {
  Text = 'text',
  Textarea = 'textarea',
  Select = 'select',
  Multiselect = 'multiselect',
  VideoResponse = 'videoresponse',
}

export class QuestionOption {
  text: string = '';
  order: number = 0;
}

export class ScreeningQuestion implements BaseEntity {
  _id?: any;
  text: string = '';
  type: QuestionType = QuestionType.Text;
  required: boolean = true;
  durationInSeconds?: number;
  formId?: any;
  order: number = 0;
  options?: QuestionOption[];
  isVerified?: boolean = true;
  userId: any;
  createdBy: any;
  createdDate: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date = new Date();
}