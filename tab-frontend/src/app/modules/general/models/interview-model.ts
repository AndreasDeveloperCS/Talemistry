import { AbstractControl } from "@angular/forms";
import { User } from "../../authentication/models/user";
import { OpenPosition } from "../../positions/models/position";
import { Skill } from "../../skills/models/skill";

export enum InterviewStatus {
  isPlanned = "In Progress",
  inProgress = "In Planned",
  isCompleted = "Completed",
  isCancelled = "Cancelled",
}
export class InterviewParticipantInfo {
  firstname?: AbstractControl<any, any>;
  lastname?: AbstractControl<any, any>;
  email?: AbstractControl<any, any>;
  phone?: AbstractControl<any, any>;
}

export class InterviewSlotInfo {
  timezone?: AbstractControl<any, any>;
  expectedDateStart?: AbstractControl<any, any>;
  expectedDateEnd?: AbstractControl<any, any>;
  expectedTimeStart?: AbstractControl<any, any>;
  expectedTimeEnd?: AbstractControl<any, any>;
}

export class InterviewSlotData {
  constructor() {
    this.expectedEnd?.setHours(this.expectedStart?.getHours() + 1);
    // console.log(this.expectedStart);
    // console.log(this.expectedEnd);
  }

  timezone?: any;
  expectedStart: Date = new Date();
  expectedEnd: Date = new Date();
  candidateId?: string;
  positionId?: string;
  participants: InterviewParticipant[] = [];
}

export class InterviewModel {

  _id?: string;

  cvInfoId?: string;
  candidateId?: string;
  positionId?: string;
  participants?: InterviewParticipant[] = [];

  timeZone?: any;
  expectedStart?: Date = new Date();
  expectedEnd?: Date = new Date();

  isActive?: boolean;
  status?: InterviewStatus = InterviewStatus.isPlanned;
  interviewTasks?: InterviewTask[];
  interviewFeedbacks?: InterviewFeedback[];
  nextStage?: boolean;
}

export class InterviewParticipant {
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  isAddedManually?: boolean;
  userId: string = '';
  user?: User;
}

export enum FeedbackType {
  general = 'General',
  summary = 'Summary',
  technical = 'Technical',
  managirial = 'Managirial',
  psychological = 'Psycological',
  candidate = 'From candidate'
}

export class InterviewFeedback {
  feedbackType: FeedbackType = FeedbackType.general;
  participant?: InterviewParticipant;
  feedback?: string;
  estimationMark?: number;
  nextStage?: boolean;
}

export class SkillTaskMatch {

  positionId?: string;
  position?: OpenPosition;

  interviewTaskId?: string;
  interviewTask?: InterviewTask
  weightedCoefficient?: number;
  weightedScore?: number;
}

export class InterviewMatch {

  _id?: string;
  interviewId?: string;

  positionId?: string;

  cvInfoId?: string;
  candidateId?: string;

  isMatched?: boolean;

  interviewResultId?: string;
}

export class Task {
  _id?: string;
  type?: string;
  targetSkill?: string;
  targetSkillId?: string;
  skill?: Skill;
  title?: string;
  description?: string;
}

export class InterviewTask {
  _id?: string;
  taskId?: string;
  task?: Task;
  answer?: string;
  assessment?: string;
  scorePercent?: number;
}
