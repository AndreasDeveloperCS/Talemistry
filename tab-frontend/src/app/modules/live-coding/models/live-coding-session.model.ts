import { ROLES } from "../../authentication/models/roles";
import { BaseEntity } from "../../general/models/base-entity";
import { ProgrammingLanguage } from "./programming-language.enum";
import { SessionStatus } from "./session-status.enum";

export class LiveCodingSession implements BaseEntity {
  _id: any;
  status: SessionStatus = SessionStatus.SCHEDULED;
  participants: LiveCodingSessionParticipant[] = [];
  language: ProgrammingLanguage = ProgrammingLanguage.JAVASCRIPT;
  taskId?: string;
  currentCode?: string;
  finalCode?: string;
  lastRun?: CodeRunResult;
  snapshots: CodeSnapshot[] = [];
  startedAt?: Date = new Date();
  finishedAt?: Date = new Date();
  userId: any;
  createdBy: any;
  createdDate?: Date = new Date();
  modifiedBy: any;
  modifiedDate?: Date = new Date();
}

export interface LiveCodingSessionParticipant {
  userId: string;
  role: ROLES.TALENT | ROLES.HR | ROLES.HM | ROLES.RC;
  name?: string;
}

export interface CodeRunResult {
  output: string;
  error?: string;
  success: boolean;
  executedAt: Date;
}

export interface CodeSnapshot {
  code: string;
  createdDate: Date;
}