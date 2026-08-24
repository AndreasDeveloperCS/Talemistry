export type DrawerType =
  | 'position'
  | 'positions-list'
  | 'company'
  | 'applicants'
  | 'candidate'
  | 'candidate-cv'
  | 'meetings-list'
  | 'meeting'
  | 'single-pipeline'
  | 'multiple-pipeline'
  | 'applicants-by-stage'
  | 'pipeline-health-preview'
  | 'applied-positions'
  | 'applied-position-details'
  | 'chat';

export interface DrawerState {
  type: DrawerType;
  id: string;
  title?: string;
  payload?: any;
}