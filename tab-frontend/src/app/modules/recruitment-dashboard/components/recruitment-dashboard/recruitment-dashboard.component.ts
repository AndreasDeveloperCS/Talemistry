import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-recruitment-dashboard',
    templateUrl: './recruitment-dashboard.component.html',
    styleUrl: './recruitment-dashboard.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecruitmentDashboardComponent {
    readonly stages: string[] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

    role: DashboardRole = 'recruiter';

    recruiterPositions: RecruiterPositionStats[] = [
        {
            id: 'all',
            title: 'All Positions',
            team: 'Global',
            active: 24,
            closed: 45,
            meetings: 4,
            candidatesByStage: {
                Applied: 123,
                Screening: 31,
                Interview: 20,
                Offer: 4,
                Hired: 0,
                Rejected: 68
            }
        },
        {
            id: 'se',
            title: 'Software Developer',
            team: 'Engineering',
            active: 8,
            closed: 16,
            meetings: 2,
            candidatesByStage: {
                Applied: 48,
                Screening: 12,
                Interview: 6,
                Offer: 2,
                Hired: 0,
                Rejected: 28
            }
        },
        {
            id: 'fe',
            title: 'Frontend Developer',
            team: 'Product',
            active: 6,
            closed: 10,
            meetings: 1,
            candidatesByStage: {
                Applied: 32,
                Screening: 8,
                Interview: 5,
                Offer: 1,
                Hired: 0,
                Rejected: 18
            }
        },
        {
            id: 'ux',
            title: 'UX Designer',
            team: 'Design',
            active: 5,
            closed: 11,
            meetings: 1,
            candidatesByStage: {
                Applied: 28,
                Screening: 6,
                Interview: 4,
                Offer: 0,
                Hired: 0,
                Rejected: 13
            }
        },
        {
            id: 'pm',
            title: 'Product Manager',
            team: 'Product',
            active: 5,
            closed: 8,
            meetings: 0,
            candidatesByStage: {
                Applied: 15,
                Screening: 5,
                Interview: 3,
                Offer: 1,
                Hired: 0,
                Rejected: 9
            }
        }
    ];

    selectedPositionId = 'all';

    recruiterInterviews: DashboardInterview[] = [
        {
            id: 'int-1',
            candidate: 'Ilona Ivanova',
            position: 'Software Developer',
            interviewer: 'Alex Carter',
            stage: 'Technical Interview',
            date: 'Apr 7, 2026',
            time: '14:30 - 15:30',
            location: 'Google Meet',
            calendarUrl: '/recruitment/calendar/schedule',
            candidateProfileUrl: '/profiles/candidate/ilona-ivanova',
            notes: 'Strong in Node.js and backend architecture. Validate system design depth.',
            status: 'upcoming'
        },
        {
            id: 'int-2',
            candidate: 'Alex Chen',
            position: 'Frontend Developer',
            interviewer: 'Lisa Anderson',
            stage: 'UI Screening',
            date: 'Apr 7, 2026',
            time: '16:00 - 17:00',
            location: 'Zoom',
            calendarUrl: '/recruitment/calendar/schedule',
            candidateProfileUrl: '/profiles/candidate/alex-chen',
            notes: 'Focus on Angular state management and accessibility standards.',
            status: 'upcoming'
        },
        {
            id: 'int-3',
            candidate: 'Maria Santos',
            position: 'UX Designer',
            interviewer: 'John Smith',
            stage: 'Portfolio Review',
            date: 'Apr 8, 2026',
            time: '10:00 - 11:00',
            location: 'MS Teams',
            calendarUrl: '/recruitment/calendar/schedule',
            candidateProfileUrl: '/profiles/candidate/maria-santos',
            notes: 'Evaluate decision making process and end-to-end UX thinking.',
            status: 'active'
        },
        {
            id: 'int-4',
            candidate: 'John Smith',
            position: 'Product Manager',
            interviewer: 'David Lee',
            stage: 'Behavioral Interview',
            date: 'Apr 9, 2026',
            time: '11:30 - 12:30',
            location: 'Google Meet',
            calendarUrl: '/recruitment/calendar/schedule',
            candidateProfileUrl: '/profiles/candidate/john-smith',
            notes: 'Cover stakeholder management and roadmap prioritization.',
            status: 'upcoming'
        }
    ];

    selectedRecruiterInterviewId = this.recruiterInterviews[0].id;

    feedbackCollectionUrl = '/recruitment/feedbacks';

    interviewerUpcoming: DashboardInterview[] = [
        ...this.recruiterInterviews,
        {
            id: 'int-5',
            candidate: 'Derek Quinn',
            position: 'Software Developer',
            interviewer: 'Alex Carter',
            stage: 'Algorithms',
            date: 'Apr 10, 2026',
            time: '09:30 - 10:30',
            location: 'Zoom',
            calendarUrl: '/recruitment/calendar/schedule',
            candidateProfileUrl: '/profiles/candidate/derek-quinn',
            notes: 'Focus on time/space trade-offs and practical coding quality.',
            status: 'upcoming'
        }
    ];

    interviewerFeedbacks: InterviewFeedback[] = [
        {
            candidate: 'Sarah Johnson',
            position: 'Software Developer',
            submittedAt: 'Apr 5, 2026',
            rating: 5,
            label: 'Strong Hire',
            summary: 'Excellent problem-solving skills and clear communication.',
            candidateProfileUrl: '/profiles/candidate/sarah-johnson'
        },
        {
            candidate: 'David Lee',
            position: 'Frontend Developer',
            submittedAt: 'Apr 4, 2026',
            rating: 5,
            label: 'Strong Hire',
            summary: 'Outstanding React and Angular expertise with good team fit.',
            candidateProfileUrl: '/profiles/candidate/david-lee'
        },
        {
            candidate: 'Emma Wilson',
            position: 'Backend Developer',
            submittedAt: 'Apr 3, 2026',
            rating: 3,
            label: 'Maybe',
            summary: 'Good fundamentals but needs stronger system design depth.',
            candidateProfileUrl: '/profiles/candidate/emma-wilson'
        }
    ];

    interviewsBySkill: SkillInterviews[] = [
        {
            skill: 'JavaScript/TypeScript',
            level: 'Expert',
            count: 18,
            conducted: [
                { candidate: 'Sarah Johnson', position: 'Software Developer', date: 'Apr 5, 2026', verdict: 'Strong Hire' },
                { candidate: 'Alex Chen', position: 'Frontend Developer', date: 'Apr 2, 2026', verdict: 'Hire' }
            ]
        },
        {
            skill: 'React/Next.js',
            level: 'Expert',
            count: 14,
            conducted: [
                { candidate: 'David Lee', position: 'Frontend Developer', date: 'Apr 4, 2026', verdict: 'Strong Hire' },
                { candidate: 'Mila Brooks', position: 'Frontend Developer', date: 'Apr 1, 2026', verdict: 'Hire' }
            ]
        },
        {
            skill: 'System Design',
            level: 'Advanced',
            count: 11,
            conducted: [
                { candidate: 'Emma Wilson', position: 'Backend Developer', date: 'Apr 3, 2026', verdict: 'Maybe' },
                { candidate: 'Daniel Price', position: 'Software Developer', date: 'Mar 30, 2026', verdict: 'No Hire' }
            ]
        },
        {
            skill: 'Algorithms',
            level: 'Expert',
            count: 9,
            conducted: [
                { candidate: 'John Smith', position: 'Software Developer', date: 'Mar 29, 2026', verdict: 'Hire' },
                { candidate: 'Helen Park', position: 'Software Developer', date: 'Mar 28, 2026', verdict: 'Strong Hire' }
            ]
        }
    ];

    selectedSkill = this.interviewsBySkill[0].skill;
    selectedInterviewerInterviewId = this.interviewerUpcoming[0].id;

    candidateObjective = 'Senior Software Developer position with focus on React and Node.js';
    matchedPositions = 24;
    candidateAppliedTotal = 12;
    candidateFunnel: StageStat[] = [
        { stage: 'Applied', value: 3 },
        { stage: 'Screening', value: 2 },
        { stage: 'Interview', value: 4 },
        { stage: 'Offer', value: 2 },
        { stage: 'Rejected', value: 1 }
    ];

    candidateApplications: CandidateApplication[] = [
        {
            position: 'Software Developer',
            company: 'Evrika',
            applied: 'Mar 25, 2026',
            updated: 'Apr 5, 2026',
            status: 'Interview',
            nextStep: 'Technical Interview: Apr 7, 2026 at 14:30'
        },
        {
            position: 'Frontend Developer',
            company: 'TechCorp',
            applied: 'Mar 28, 2026',
            updated: 'Apr 3, 2026',
            status: 'Screening',
            nextStep: 'Awaiting recruiter feedback'
        },
        {
            position: 'Full Stack Engineer',
            company: 'StartupXYZ',
            applied: 'Apr 1, 2026',
            updated: 'Apr 1, 2026',
            status: 'Applied',
            nextStep: 'Application submitted'
        },
        {
            position: 'React Developer',
            company: 'FinTech Pro',
            applied: 'Mar 10, 2026',
            updated: 'Apr 6, 2026',
            status: 'Offer',
            nextStep: 'Offer discussion this week'
        },
        {
            position: 'Backend Developer',
            company: 'DataFlow',
            applied: 'Mar 18, 2026',
            updated: 'Mar 28, 2026',
            status: 'Rejected',
            nextStep: 'Process completed'
        }
    ];

    setRole(role: DashboardRole): void {
        this.role = role;
    }

    setPosition(positionId: string): void {
        this.selectedPositionId = positionId;
    }

    setRecruiterInterview(interviewId: string): void {
        this.selectedRecruiterInterviewId = interviewId;
    }

    setInterviewerInterview(interviewId: string): void {
        this.selectedInterviewerInterviewId = interviewId;
    }

    setSkill(skill: string): void {
        this.selectedSkill = skill;
    }

    get selectedPosition(): RecruiterPositionStats {
        return this.recruiterPositions.find((item) => item.id === this.selectedPositionId) ?? this.recruiterPositions[0];
    }

    get selectedRecruiterInterview(): DashboardInterview {
        return this.recruiterInterviews.find((item) => item.id === this.selectedRecruiterInterviewId) ?? this.recruiterInterviews[0];
    }

    get selectedInterviewerInterview(): DashboardInterview {
        return this.interviewerUpcoming.find((item) => item.id === this.selectedInterviewerInterviewId) ?? this.interviewerUpcoming[0];
    }

    get activeMeetingsCount(): number {
        return this.recruiterInterviews.filter((item) => item.status === 'active').length;
    }

    get upcomingMeetingsCount(): number {
        return this.recruiterInterviews.filter((item) => item.status === 'upcoming').length;
    }

    get stageStats(): StageStat[] {
        const selected = this.selectedPosition;
        return this.stages.map((stage) => ({ stage, value: selected.candidatesByStage[stage] ?? 0 }));
    }

    get stageTotal(): number {
        return this.stageStats.reduce((sum, stat) => sum + stat.value, 0);
    }

    get passRate(): number {
        const passed =
            (this.selectedPosition.candidatesByStage['Offer'] ?? 0) +
            (this.selectedPosition.candidatesByStage['Hired'] ?? 0);
        return this.stageTotal ? Math.round((passed / this.stageTotal) * 100) : 0;
    }

    get selectedSkillSummary(): SkillInterviews {
        return this.interviewsBySkill.find((item) => item.skill === this.selectedSkill) ?? this.interviewsBySkill[0];
    }

    get totalInterviewsConducted(): number {
        return this.interviewsBySkill.reduce((sum, item) => sum + item.count, 0);
    }

    stageWidth(value: number, max: number): string {
        if (!max) {
            return '0%';
        }
        return `${Math.max((value / max) * 100, 4)}%`;
    }

    stagePercent(value: number, total: number): number {
        if (!total) {
            return 0;
        }
        return Math.round((value / total) * 100);
    }

    get candidateFunnelMax(): number {
        return Math.max(...this.candidateFunnel.map((item) => item.value));
    }
}

type DashboardRole = 'recruiter' | 'interviewer' | 'candidate';

interface RecruiterPositionStats {
    id: string;
    title: string;
    team: string;
    active: number;
    closed: number;
    meetings: number;
    candidatesByStage: Record<string, number>;
}

interface DashboardInterview {
    id: string;
    candidate: string;
    position: string;
    interviewer: string;
    stage: string;
    date: string;
    time: string;
    location: string;
    calendarUrl: string;
    candidateProfileUrl: string;
    notes: string;
    status: 'active' | 'upcoming';
}

interface StageStat {
    stage: string;
    value: number;
}

interface InterviewFeedback {
    candidate: string;
    position: string;
    submittedAt: string;
    rating: number;
    label: string;
    summary: string;
    candidateProfileUrl: string;
}

interface ConductedInterview {
    candidate: string;
    position: string;
    date: string;
    verdict: string;
}

interface SkillInterviews {
    skill: string;
    level: string;
    count: number;
    conducted: ConductedInterview[];
}

interface CandidateApplication {
    position: string;
    company: string;
    applied: string;
    updated: string;
    status: string;
    nextStep: string;
}
