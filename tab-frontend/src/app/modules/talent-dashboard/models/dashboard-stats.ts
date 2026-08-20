import { StageType } from "../../position-pipelines/models/pipeline-stage";

export interface AppliedPosition {
  id: string;
  title: string;
  company: string;
  stage: StageType;
  appliedDate: string;
  lastUpdate: string;
  nextInterview: {
    date: string;
    time: string;
    type: string;
  } | null;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
}

export interface FunnelBar {
  name: string;
  count: number;
  color: string;
  pct: number;
}