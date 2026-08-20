export enum PipelineIcon {
  SOURCED = 'search',
  APPLIED = 'forward_to_inbox', // send, assignment_turned_in
  PHONE_SCREEN = 'phone',
  ASSESSMENT = 'quiz',
  INTERVIEW = 'question_answer', // forum
  OFFER = 'work', // handshake, contract
  HIRED = 'check_circle',
}

export interface Pipeline {
  name: string;
  icon: PipelineIcon;
}

export const PIPELINES: Pipeline[] = [
  { name: 'Sourced', icon: PipelineIcon.SOURCED },
  { name: 'Applied', icon: PipelineIcon.APPLIED },
  { name: 'Screening', icon: PipelineIcon.PHONE_SCREEN },
  { name: 'Assessment', icon: PipelineIcon.ASSESSMENT },
  { name: 'Interview', icon: PipelineIcon.INTERVIEW },
  { name: 'Offer', icon: PipelineIcon.OFFER },
  { name: 'Hired', icon: PipelineIcon.HIRED },
];
