import { PipelineStage, StageType } from "./pipeline-stage";

export enum STAGES_NAMES {
  SOURCED = 'Sourced',
  APPLIED = 'Applied',
  SCREENING = 'Screening',
  ASSESSMENT = 'Assessment',
  INTERVIEW = 'Interview',
  OFFER = 'Offer',
  HIRED = 'Hired'
};

export const DEFAULT_PIPELINE_STAGES: Partial<PipelineStage>[] = [
  {
    name: STAGES_NAMES.SOURCED,
    order: 0,
    description: 'Talents identified through sourcing',
    icon: 'search',
    type: StageType.DEFAULT
  },
  {
    name: STAGES_NAMES.APPLIED,
    order: 1,
    description: 'Talents who applied directly',
    icon: 'how_to_reg',
    type: StageType.CV_REVIEW
  },
  {
    name: STAGES_NAMES.SCREENING,
    order: 2,
    description: 'Initial screening phase',
    icon: 'filter_list',
    type: StageType.SCREENING
  },
  {
    name: STAGES_NAMES.ASSESSMENT,
    order: 3,
    description: 'Technical/skills assessment',
    icon: 'assignment',
    type: StageType.ASSESSMENT
  },
  {
    name: STAGES_NAMES.INTERVIEW,
    order: 4,
    description: 'Interview stage',
    icon: 'groups',
    type: StageType.INTERVIEW
  },
  {
    name: STAGES_NAMES.OFFER,
    order: 5,
    description: 'Offer extended',
    icon: 'handshake',
    type: StageType.OFFER
  },
  {
    name: STAGES_NAMES.HIRED,
    order: 6,
    description: 'Talent hired',
    icon: 'check_circle',
    type: StageType.FINAL
  },
];