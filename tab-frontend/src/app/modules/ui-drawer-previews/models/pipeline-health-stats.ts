import { StageType } from "../../position-pipelines/models/pipeline-stage";

export interface PipelineHealthStats {
  funnel: PipelineHealthStage[];
  kpis: PipelineHealthKpi[];
  bottlenecks: PipelineHealthBottleneck[];
  topPositions: PipelineHealthPosition[];
  insights: string[];
}

export interface PipelineHealthStage {
  stage: string;
  stageType: StageType;
  count: number;
  conversion: number;
  color: string;
}

export interface PipelineHealthKpi {
  label: string;
  value: string;
  icon: string;
}

export interface PipelineHealthBottleneck {
  stage: string;
  loss: string;
  avgDays: number;
}

export interface PipelineHealthPosition {
  id: any;
  title: string;
  hires: number;
  status: string;
}