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

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  {
    _id: undefined,
    positionId: '',
    positionPipelineId: '',
    name: STAGES_NAMES.SOURCED,
    order: 0,
    type: StageType.DEFAULT,
    description: 'Talents identified through sourcing',
    icon: 'search'
  },
  {
    _id: undefined,
    positionId: '',
    positionPipelineId: '',
    name: STAGES_NAMES.APPLIED,
    order: 1,
    type: StageType.CV_REVIEW,
    description: 'Talents who applied directly',
    icon: 'how_to_reg' //forward_to_inbox
  },
  {
    _id: undefined,
    positionId: '',
    positionPipelineId: '',
    name: STAGES_NAMES.SCREENING,
    order: 2,
    type: StageType.SCREENING,
    description: 'Initial screening phase',
    icon: 'filter_list'
  },
  {
    _id: undefined,
    positionId: '',
    positionPipelineId: '',
    name: STAGES_NAMES.ASSESSMENT,
    order: 3,
    type: StageType.ASSESSMENT,
    description: 'Technical/skills assessment',
    icon: 'assignment' //quiz
  },
  {
    _id: undefined,
    positionId: '',
    positionPipelineId: '',
    name: STAGES_NAMES.INTERVIEW,
    order: 4,
    type: StageType.INTERVIEW,
    description: 'Interview stage',
    icon: 'groups' //question_answer
  },
  {
    _id: undefined,
    positionId: '',
    positionPipelineId: '',
    name: STAGES_NAMES.OFFER,
    order: 5,
    type: StageType.OFFER,
    description: 'Offer extended',
    icon: 'handshake' //work
  },
  {
    _id: undefined,
    positionId: '',
    positionPipelineId: '',
    name: STAGES_NAMES.HIRED,
    order: 6,
    type: StageType.FINAL,
    description: 'Talent hired',
    icon: 'check_circle'
  }
];
