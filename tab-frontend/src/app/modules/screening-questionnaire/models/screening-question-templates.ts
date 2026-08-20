import { BaseEntity } from "../../general/models/base-entity";
import { QuestionType } from "../../position-management/models/screening-question";

export enum QuestionCategory {
  Motivation = 'motivation',
  Communication = 'communication',
  CultureFit = 'culture_fit',
  ProblemSolving = 'problem_solving',
  Technical = 'technical',
  Leadership = 'leadership',
}

export enum PositionTag {
  General = 'general',
  Frontend = 'frontend',
  Backend = 'backend',
  Fullstack = 'fullstack',
  Designer = 'designer',
  QA = 'qa',
  Manager = 'manager',
  DevOps = 'devops',
  Mobile = 'mobile',
}

export enum SeniorityLevel {
  Junior = 'junior',
  Middle = 'middle',
  Senior = 'senior',
  Lead = 'lead',
}

export class ScreeningQuestionTemplate implements BaseEntity {
  _id?: any;
  text: string = '';
  type: QuestionType = QuestionType.VideoResponse;
  required: boolean = true;
  durationInSeconds?: number;
  positionTags: PositionTag[] = [];
  seniorityLevels: SeniorityLevel[] = [];
  category: QuestionCategory = QuestionCategory.Technical;
  usageCount?: number = 0;
  isVerified?: boolean = true;
  userId?: any;
  createdBy?: any;
  createdDate?: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date = new Date();
}

export interface RecommendedQuestionsResponse {
  positionTag: PositionTag;
  seniorityLevel: SeniorityLevel | null;
  questions: ScreeningQuestionTemplate[];
}

export interface RecommendedQuestionsRequest {
  positionTitle: string;
  limit: number;
}