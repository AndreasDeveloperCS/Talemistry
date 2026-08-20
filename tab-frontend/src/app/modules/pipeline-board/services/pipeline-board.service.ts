import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Position,
  Applicant,
  Interview,
  Feedback,
  StageCount
} from '../models/pipeline-board-types';
import { STAGES_NAMES } from '../../position-pipelines/models/default-pipeline-stages';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private positionsSubject = new BehaviorSubject<Position[]>([
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      dateOpened: '2024-01-15',
      status: 'active',
      applicantCount: 24,
      department: 'Engineering'
    },
    {
      id: '2',
      title: 'Product Designer',
      company: 'TechCorp Inc.',
      location: 'Remote',
      dateOpened: '2024-01-20',
      status: 'active',
      applicantCount: 18,
      department: 'Design'
    },
    {
      id: '3',
      title: 'Backend Engineer',
      company: 'TechCorp Inc.',
      location: 'New York, NY',
      dateOpened: '2024-02-01',
      status: 'active',
      applicantCount: 31,
      department: 'Engineering'
    },
    {
      id: '4',
      title: 'DevOps Engineer',
      company: 'TechCorp Inc.',
      location: 'Austin, TX',
      dateOpened: '2024-01-10',
      status: 'paused',
      applicantCount: 12,
      department: 'Operations'
    },
    {
      id: '5',
      title: 'Data Scientist',
      company: 'TechCorp Inc.',
      location: 'Boston, MA',
      dateOpened: '2023-12-15',
      status: 'closed',
      applicantCount: 45,
      department: 'Data'
    }
  ]);

  private applicantsSubject = new BehaviorSubject<Applicant[]>([
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      stage: STAGES_NAMES.INTERVIEW,
      positionId: '1',
      matchScore: 92,
      isPremium: true,
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
      hrComment: 'Excellent candidate with strong technical background. Schedule final round ASAP.',
      profileUrl: 'https://linkedin.com/in/sarahjohnson',
      appliedDate: '2024-01-18'
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 234-5678',
      stage: STAGES_NAMES.ASSESSMENT,
      positionId: '1',
      matchScore: 85,
      isPremium: false,
      skills: ['Vue.js', 'JavaScript', 'CSS', 'Python'],
      hrComment: 'Good communication skills. Waiting for assessment results.',
      appliedDate: '2024-01-20'
    },
    {
      id: '3',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@email.com',
      phone: '+1 (555) 345-6789',
      stage: STAGES_NAMES.SCREENING,
      positionId: '1',
      matchScore: 78,
      isPremium: true,
      skills: ['Angular', 'TypeScript', 'RxJS', 'SCSS'],
      appliedDate: '2024-01-22'
    },
    {
      id: '4',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@email.com',
      phone: '+1 (555) 456-7890',
      stage: STAGES_NAMES.OFFER,
      positionId: '1',
      matchScore: 95,
      isPremium: true,
      skills: ['React', 'Next.js', 'AWS', 'Docker'],
      hrComment: 'Top candidate! Offer extended, awaiting response.',
      profileUrl: 'https://linkedin.com/in/davidkim',
      appliedDate: '2024-01-10'
    },
    {
      id: '5',
      firstName: 'Jessica',
      lastName: 'Taylor',
      email: 'j.taylor@email.com',
      phone: '+1 (555) 567-8901',
      stage: STAGES_NAMES.APPLIED,
      positionId: '1',
      matchScore: 72,
      isPremium: false,
      skills: ['HTML', 'CSS', 'JavaScript', 'React'],
      appliedDate: '2024-01-25'
    },
    {
      id: '6',
      firstName: 'Robert',
      lastName: 'Wilson',
      email: 'r.wilson@email.com',
      phone: '+1 (555) 678-9012',
      stage: STAGES_NAMES.SOURCED,
      positionId: '1',
      matchScore: 68,
      isPremium: false,
      skills: ['JavaScript', 'PHP', 'MySQL'],
      appliedDate: '2024-01-26'
    },
    {
      id: '7',
      firstName: 'Amanda',
      lastName: 'Lee',
      email: 'amanda.lee@email.com',
      phone: '+1 (555) 789-0123',
      stage: STAGES_NAMES.HIRED,
      positionId: '1',
      matchScore: 98,
      isPremium: true,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
      hrComment: 'Hired! Start date: Feb 15, 2024',
      profileUrl: 'https://linkedin.com/in/amandalee',
      appliedDate: '2024-01-05'
    }
  ]);

  private interviewsSubject = new BehaviorSubject<Interview[]>([
    {
      id: '1',
      applicantId: '1',
      type: 'cv_review',
      status: 'completed',
      completedDate: '2024-01-19',
      duration: 15,
      interviewer: 'HR Team',
      notes: 'CV reviewed and approved'
    },
    {
      id: '2',
      applicantId: '1',
      type: 'prescreen',
      status: 'completed',
      completedDate: '2024-01-21',
      duration: 30,
      interviewer: 'Jane Smith',
      notes: 'Excellent communication skills'
    },
    {
      id: '3',
      applicantId: '1',
      type: 'tech_interview',
      status: 'scheduled',
      scheduledDate: '2024-02-05T14:00:00',
      duration: 60,
      interviewer: 'John Developer',
      meetingLink: 'https://meet.google.com/abc-defg-hij'
    },
    {
      id: '4',
      applicantId: '2',
      type: 'cv_review',
      status: 'completed',
      completedDate: '2024-01-21',
      duration: 15,
      interviewer: 'HR Team'
    },
    {
      id: '5',
      applicantId: '2',
      type: 'prescreen',
      status: 'completed',
      completedDate: '2024-01-23',
      duration: 30,
      interviewer: 'Jane Smith'
    },
    {
      id: '6',
      applicantId: '4',
      type: 'cv_review',
      status: 'completed',
      completedDate: '2024-01-11',
      duration: 15,
      interviewer: 'HR Team'
    },
    {
      id: '7',
      applicantId: '4',
      type: 'prescreen',
      status: 'completed',
      completedDate: '2024-01-13',
      duration: 30,
      interviewer: 'Jane Smith'
    },
    {
      id: '8',
      applicantId: '4',
      type: 'tech_interview',
      status: 'completed',
      completedDate: '2024-01-18',
      duration: 60,
      interviewer: 'John Developer'
    },
    {
      id: '9',
      applicantId: '4',
      type: 'managerial_interview',
      status: 'completed',
      completedDate: '2024-01-22',
      duration: 45,
      interviewer: 'Mike Manager'
    }
  ]);

  private feedbackSubject = new BehaviorSubject<Feedback[]>([
    {
      id: '1',
      interviewId: '1',
      aiAnalysis: {
        summary: 'Strong candidate with excellent technical background in frontend development. Resume demonstrates progressive career growth and relevant project experience.',
        strengths: ['5+ years React experience', 'Strong TypeScript skills', 'Leadership experience', 'Open source contributions'],
        improvements: ['Could highlight more backend experience', 'Add more quantifiable achievements'],
        overallScore: 88,
        questionsAnswers: []
      },
      expertReview: {
        reviewer: 'HR Manager',
        rating: 4,
        comments: 'CV is well-structured and highlights relevant experience. Recommend proceeding to phone screen.',
        recommendation: 'strong_yes'
      }
    },
    {
      id: '2',
      interviewId: '2',
      aiAnalysis: {
        summary: 'Candidate demonstrated excellent communication skills and genuine enthusiasm for the role. Cultural fit appears strong.',
        strengths: ['Clear communication', 'Relevant experience', 'Salary expectations aligned', 'Available to start soon'],
        improvements: ['Could ask more questions about team structure'],
        overallScore: 85,
        questionsAnswers: [
          { question: 'Why are you interested in this role?', answer: 'Passionate about building scalable frontend applications and excited about the company\'s tech stack.', rating: 5 },
          { question: 'What are your salary expectations?', answer: 'Looking for $150-170k base, flexible on equity split.', rating: 4 },
          { question: 'When can you start?', answer: 'Available to start within 2 weeks of offer acceptance.', rating: 5 }
        ]
      },
      interviewerFeedback: {
        interviewer: 'Jane Smith',
        rating: 4,
        notes: 'Great conversation! Candidate is articulate and seems genuinely interested. Recommend moving forward.',
        communicationScore: 5,
        cultureFitScore: 4
      },
      recordingUrl: 'https://recordings.example.com/prescreen-001'
    },
    {
      id: '3',
      interviewId: '3',
      aiAnalysis: {
        summary: 'Technical interview pending. AI analysis will be available after the interview is completed.',
        strengths: [],
        improvements: [],
        overallScore: 0,
        questionsAnswers: []
      }
    },
    {
      id: '4',
      interviewId: '8',
      aiAnalysis: {
        summary: 'Exceptional technical performance. Candidate solved all coding challenges efficiently and demonstrated deep understanding of system design principles.',
        strengths: ['Excellent problem-solving', 'Clean code practices', 'Strong system design knowledge', 'Good debugging skills'],
        improvements: ['Could improve time complexity explanations'],
        overallScore: 94,
        questionsAnswers: [
          { question: 'Implement a debounce function', answer: 'Provided optimal solution with TypeScript generics and proper cleanup.', rating: 5 },
          { question: 'Design a real-time notification system', answer: 'Proposed WebSocket solution with fallback to SSE, discussed scaling strategies.', rating: 5 },
          { question: 'Optimize a React component with performance issues', answer: 'Identified unnecessary re-renders, applied memo, useMemo, and useCallback appropriately.', rating: 4 }
        ]
      },
      interviewerFeedback: {
        interviewer: 'John Developer',
        rating: 5,
        notes: 'One of the strongest candidates I\'ve interviewed. Highly recommend for hire.',
        technicalScore: 5,
        communicationScore: 4,
        cultureFitScore: 5
      },
      recordingUrl: 'https://recordings.example.com/tech-004',
      liveCodingUrl: 'https://codesandbox.io/s/interview-david-kim'
    }
  ]);

  positions$ = this.positionsSubject.asObservable();
  applicants$ = this.applicantsSubject.asObservable();
  interviews$ = this.interviewsSubject.asObservable();
  feedback$ = this.feedbackSubject.asObservable();

  getStages(): STAGES_NAMES[] {
    return Object.values(STAGES_NAMES);
  }

  getStageCounts(applicants: Applicant[]): StageCount[] {
    return this.getStages().map(stage => ({
      stage,
      count: applicants.filter(a => a.stage === stage).length
    }));
  }

  getApplicantsByPosition(positionId: string): Applicant[] {
    return this.applicantsSubject.value.filter(a => a.positionId === positionId);
  }

  getInterviewsByApplicant(applicantId: string): Interview[] {
    return this.interviewsSubject.value.filter(i => i.applicantId === applicantId);
  }

  getFeedbackByInterview(interviewId: string): Feedback | undefined {
    return this.feedbackSubject.value.find(f => f.interviewId === interviewId);
  }

  updateApplicantStage(applicantId: string, newStage: STAGES_NAMES): void {
    const applicants = this.applicantsSubject.value.map(a =>
      a.id === applicantId ? { ...a, stage: newStage } : a
    );
    this.applicantsSubject.next(applicants);
  }
}