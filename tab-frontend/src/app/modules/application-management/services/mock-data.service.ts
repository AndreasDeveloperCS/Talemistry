import { Injectable } from '@angular/core';
import { EnrichedTalentPipelineProgress, StageStatus } from '../../position-management/models/talent-pipeline-progress';
import { STAGES_NAMES } from '../../position-pipelines/models/default-pipeline-stages';
import { StageType } from '../../position-pipelines/models/pipeline-stage';
import { ScreeningSingleAnswer } from '../../position-management/models/screening-response';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  mockApplications: EnrichedTalentPipelineProgress[] = [
    {
      _id: '1',
      positionId: 'pos1',
      positionPipelineId: 'pipe1',
      talentId: 'talent1',
      talentName: 'John Doe',
      stageId: 'stage3',
      stageName: STAGES_NAMES.SCREENING,
      stageType: StageType.SCREENING,
      status: StageStatus.pending,
      notes: '',
      positionName: 'Senior Frontend Developer',
      companyName: 'TechCorp',
      companyId: 'comp1',
      createdDate: new Date('2025-01-15'),
      interviewFeedback: '',
      assessmentScore: 0,
    },
    {
      _id: '2',
      positionId: 'pos2',
      positionPipelineId: 'pipe2',
      talentId: 'talent1',
      talentName: 'John Doe',
      stageId: 'stage5',
      stageName: STAGES_NAMES.INTERVIEW,
      stageType: StageType.INTERVIEW,
      status: StageStatus.pending,
      notes: '',
      positionName: 'Full Stack Engineer',
      companyName: 'InnovateLabs',
      companyId: 'comp2',
      createdDate: new Date('2025-01-10'),
      interviewFeedback: 'Strong technical skills, good communication',
      assessmentScore: 85,
    },
    {
      _id: '3',
      positionId: 'pos3',
      positionPipelineId: 'pipe3',
      talentId: 'talent1',
      talentName: 'John Doe',
      stageId: 'stage2',
      stageName: STAGES_NAMES.APPLIED,
      stageType: StageType.CV_REVIEW,
      status: StageStatus.passed,
      notes: '',
      positionName: 'React Developer',
      companyName: 'StartupXYZ',
      companyId: 'comp3',
      createdDate: new Date('2025-01-20'),
      interviewFeedback: '',
      assessmentScore: 0,
    },
    {
      _id: '4',
      positionId: 'pos4',
      positionPipelineId: 'pipe4',
      talentId: 'talent1',
      talentName: 'John Doe',
      stageId: 'stage6',
      stageName: STAGES_NAMES.OFFER,
      stageType: StageType.OFFER,
      status: StageStatus.pending,
      notes: '',
      positionName: 'Lead Developer',
      companyName: 'DevCo',
      companyId: 'comp4',
      createdDate: new Date('2025-01-05'),
      interviewFeedback: 'Excellent candidate, team fit confirmed',
      assessmentScore: 92,
    },
    {
      _id: '5',
      positionId: 'pos5',
      positionPipelineId: 'pipe5',
      talentId: 'talent1',
      talentName: 'John Doe',
      stageId: 'stage4',
      stageName: STAGES_NAMES.ASSESSMENT,
      stageType: StageType.ASSESSMENT,
      status: StageStatus.pending,
      notes: '',
      positionName: 'Software Engineer',
      companyName: 'CloudTech',
      companyId: 'comp5',
      createdDate: new Date('2025-01-18'),
      interviewFeedback: '',
      assessmentScore: 78,
    },
  ];

  screeningQuestions: ScreeningSingleAnswer[] = [
    {
      questionId: '1',
      questionText: 'What is your current location?',
      value: 'San Francisco, CA'
    },
    {
      questionId: '1',
      questionText: 'What are your salary expectations?',
      value: '$120,000 - $150,000'
    },
    {
      questionId: '1',
      questionText: 'Are you legally authorized to work in this country?',
      value: 'Yes'
    },
    {
      questionId: '1',
      questionText: 'What is your notice period?',
      value: '2 weeks'
    },
    {
      questionId: '1',
      questionText: 'Why are you interested in this position?',
      value: 'I am passionate about building scalable web applications and excited about the opportunity to work with modern technologies. Your company\'s focus on innovation aligns with my career goals.'
    },
    {
      questionId: '1',
      questionText: 'What are your key technical skills?',
      value: 'React, Next.js, TypeScript, Node.js, PostgreSQL, AWS'
    },
    {
      questionId: '1',
      questionText: 'How many years of relevant experience do you have?',
      value: '5 years of professional experience in frontend development'
    },
    {
      questionId: '1',
      questionText: 'Are you open to remote work?',
      value: 'Yes, I prefer remote or hybrid positions'
    }
  ];

  getApplications() {
    return this.mockApplications;
  }

  getScreeningQuestions() {
    return this.screeningQuestions;
  }
}
