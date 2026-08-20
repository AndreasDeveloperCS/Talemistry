import { STAGES_NAMES } from "../../position-pipelines/models/default-pipeline-stages";

export type InterviewType = 'cv_review' | 'prescreen' | 'tech_interview' | 'managerial_interview' | 'custom_interview';
export type InterviewStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';

export interface Position {
  id: string;
  title: string;
  company: string;
  location: string;
  dateOpened: string;
  status: 'active' | 'paused' | 'closed';
  applicantCount: number;
  department: string;
}

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  stage: STAGES_NAMES;
  positionId: string;
  matchScore: number;
  isPremium: boolean;
  skills: string[];
  hrComment?: string;
  profileUrl?: string;
  appliedDate: string;
}

export interface Interview {
  id: string;
  applicantId: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledDate?: string;
  completedDate?: string;
  duration?: number;
  interviewer?: string;
  meetingLink?: string;
  notes?: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  rating: number;
}

export interface Feedback {
  id: string;
  interviewId: string;
  aiAnalysis?: {
    summary: string;
    strengths: string[];
    improvements: string[];
    overallScore: number;
    questionsAnswers: QuestionAnswer[];
  };
  expertReview?: {
    reviewer: string;
    rating: number;
    comments: string;
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  };
  interviewerFeedback?: {
    interviewer: string;
    rating: number;
    notes: string;
    technicalScore?: number;
    communicationScore?: number;
    cultureFitScore?: number;
  };
  recordingUrl?: string;
  liveCodingUrl?: string;
}

export interface StageCount {
  stage: STAGES_NAMES;
  count: number;
}