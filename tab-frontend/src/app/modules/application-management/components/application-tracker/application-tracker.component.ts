import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-application-tracker',
  templateUrl: './application-tracker.component.html',
  styleUrl: './application-tracker.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicationTrackerComponent implements OnInit {
  positions: Position[] = []
  selectedPosition: Position | null = null
  selectedStage: StageData | null = null
  skillComparison: SkillComparison | null = null
  assessment: Assessment | null = null

  ngOnInit(): void {
    this.loadMockData()
    if (this.positions.length > 0) {
      this.selectPosition(this.positions[0])
    }
  }

  get completedStagesCount() {
    return this.selectedPosition?.stages?.filter(
      s => s.status === 'COMPLETED'
    ).length ?? 0;
  }

  loadMockData(): void {
    // Mock data for positions
    this.positions = [
      {
        id: "1",
        positionName: "Senior Frontend Developer",
        companyName: "TechCorp Inc.",
        proficiencyLevel: "SENIOR",
        workType: "REMOTE",
        appliedDate: new Date("2024-01-15"),
        currentStage: "INTERVIEW",
        skillMatch: 87,
        stages: [
          {
            id: "s1",
            name: "SOURCED",
            status: "COMPLETED",
            completedDate: new Date("2024-01-15"),
          },
          {
            id: "s2",
            name: "APPLIED",
            status: "COMPLETED",
            completedDate: new Date("2024-01-16"),
          },
          {
            id: "s3",
            name: "SCREENING",
            status: "COMPLETED",
            completedDate: new Date("2024-01-20"),
          },
          {
            id: "s4",
            name: "ASSESSMENT",
            status: "COMPLETED",
            completedDate: new Date("2024-01-25"),
          },
          {
            id: "s5",
            name: "INTERVIEW",
            status: "IN_PROGRESS",
            interviewDetails: {
              interviewer: "Sarah Johnson",
              interviewDate: new Date("2024-02-01"),
              duration: 60,
              score: 8.5,
              summary:
                "Excellent technical skills demonstrated. Strong problem-solving abilities and clear communication.",
              notes: [
                "Deep understanding of React and modern frontend architecture",
                "Good knowledge of performance optimization techniques",
                "Experience with CI/CD pipelines and testing frameworks",
              ],
              questions: [
                {
                  question: "Explain the virtual DOM and how React uses it for optimization",
                  answer:
                    "The virtual DOM is a lightweight copy of the actual DOM. React uses it to minimize direct DOM manipulations by first updating the virtual DOM, then calculating the minimal set of changes needed...",
                  interpretation: "Strong understanding of React internals and optimization strategies",
                  score: 9,
                },
                {
                  question: "How would you optimize a React application with performance issues?",
                  answer:
                    "I would start by profiling with React DevTools, identify unnecessary re-renders, implement memoization with useMemo and useCallback, lazy load components...",
                  interpretation: "Comprehensive approach to performance optimization",
                  score: 8,
                },
              ],
              feedback: "Outstanding candidate with strong technical foundation and excellent communication skills.",
              strengths: ["Technical expertise", "Problem-solving", "Communication"],
              areasForImprovement: ["More experience with backend integration would be beneficial"],
            },
          },
          {
            id: "s6",
            name: "OFFER",
            status: "PENDING",
          },
          {
            id: "s7",
            name: "HIRED",
            status: "PENDING",
          },
        ],
      },
      {
        id: "2",
        positionName: "Full Stack Engineer",
        companyName: "StartupHub",
        proficiencyLevel: "MIDDLE",
        workType: "HYBRID",
        appliedDate: new Date("2024-01-20"),
        currentStage: "SCREENING",
        skillMatch: 72,
        stages: [
          {
            id: "s1",
            name: "SOURCED",
            status: "COMPLETED",
            completedDate: new Date("2024-01-20"),
          },
          {
            id: "s2",
            name: "APPLIED",
            status: "COMPLETED",
            completedDate: new Date("2024-01-21"),
          },
          {
            id: "s3",
            name: "SCREENING",
            status: "IN_PROGRESS",
          },
          {
            id: "s4",
            name: "ASSESSMENT",
            status: "PENDING",
          },
          {
            id: "s5",
            name: "INTERVIEW",
            status: "PENDING",
          },
          {
            id: "s6",
            name: "OFFER",
            status: "PENDING",
          },
          {
            id: "s7",
            name: "HIRED",
            status: "PENDING",
          },
        ],
      },
    ]
  }

  selectPosition(position: Position): void {
    this.selectedPosition = position
    this.selectedStage = null
    this.loadSkillComparison(position.id)
    this.loadAssessment(position.id)
  }

  selectStage(stage: StageData): void {
    this.selectedStage = stage
  }

  loadSkillComparison(positionId: string): void {
    // Mock skill comparison data
    this.skillComparison = {
      matchPercentage: 87,
      required: ["React", "TypeScript", "Node.js", "CSS", "Git", "Testing", "CI/CD"],
      confirmed: ["React", "TypeScript", "CSS", "Git", "Testing"],
      missing: ["Node.js", "CI/CD"],
      detailedSkills: [
        {
          name: "React",
          requiredLevel: 8,
          talentLevel: 9,
          matchPercentage: 100,
          status: "excellent",
          notes: "Advanced hooks knowledge, state management, and performance optimization",
        },
        {
          name: "TypeScript",
          requiredLevel: 7,
          talentLevel: 8,
          matchPercentage: 100,
          status: "excellent",
          notes: "Strong typing skills, generics, and utility types mastery",
        },
        {
          name: "Node.js",
          requiredLevel: 6,
          talentLevel: 4,
          matchPercentage: 67,
          status: "partial",
          notes: "Basic API development, needs more experience with microservices",
        },
        {
          name: "CSS",
          requiredLevel: 7,
          talentLevel: 7,
          matchPercentage: 100,
          status: "good",
          notes: "Proficient in modern CSS, Flexbox, Grid, and responsive design",
        },
        {
          name: "Testing",
          requiredLevel: 6,
          talentLevel: 6,
          matchPercentage: 100,
          status: "good",
          notes: "Experience with Jest, React Testing Library, and E2E testing",
        },
        {
          name: "CI/CD",
          requiredLevel: 5,
          talentLevel: 2,
          matchPercentage: 40,
          status: "missing",
          notes: "Limited experience with deployment pipelines and automation",
        },
      ],
    }
  }

  loadAssessment(positionId: string): void {
    // Mock assessment data
    this.assessment = {
      id: "assess-1",
      assessmentName: "Technical Assessment - Frontend",
      completedDate: new Date("2024-01-25"),
      duration: 90,
      totalScore: 42,
      maxScore: 50,
      percentage: 84,
      evaluator: "John Smith, Senior Tech Lead",
      feedback:
        "Strong performance overall. Demonstrated excellent problem-solving skills and clean code practices. Minor improvements needed in algorithmic optimization.",
      questions: [
        {
          id: "q1",
          question: "Implement a custom React hook for debouncing user input",
          type: "CODING_CHALLENGE",
          answer:
            "function useDebounce(value, delay) { const [debouncedValue, setDebouncedValue] = useState(value); useEffect(() => { const handler = setTimeout(() => { setDebouncedValue(value); }, delay); return () => clearTimeout(handler); }, [value, delay]); return debouncedValue; }",
          score: 10,
          maxScore: 10,
          feedback: "Perfect implementation with proper cleanup",
        },
        {
          id: "q2",
          question: "Explain the differences between useEffect and useLayoutEffect",
          type: "SHORT_ANSWER",
          answer:
            "useEffect runs asynchronously after paint, while useLayoutEffect runs synchronously before paint. useLayoutEffect is useful when you need to read layout from DOM and synchronously re-render...",
          score: 8,
          maxScore: 10,
          feedback: "Good explanation, could mention more edge cases",
        },
        {
          id: "q3",
          question: "What are the key principles of responsive web design?",
          type: "MULTIPLE_CHOICE",
          answer: "Fluid grids, flexible images, media queries, mobile-first approach, and progressive enhancement",
          score: 10,
          maxScore: 10,
          feedback: "Comprehensive answer covering all key principles",
        },
        {
          id: "q4",
          question: "Optimize a React component that re-renders unnecessarily",
          type: "CODING_CHALLENGE",
          answer:
            "Used React.memo for component memoization, useMemo for expensive calculations, and useCallback for function references to prevent unnecessary re-renders",
          score: 9,
          maxScore: 10,
          feedback: "Excellent optimization strategy, minor code style improvement needed",
        },
        {
          id: "q5",
          question: "Describe your approach to state management in large-scale applications",
          type: "ESSAY",
          answer:
            "For large applications, I use a combination of Context API for global UI state, React Query for server state management, and local state with hooks for component-specific data. This separation of concerns keeps the architecture clean...",
          score: 5,
          maxScore: 10,
          feedback: "Good understanding but could elaborate more on scalability patterns",
        },
      ],
    }
  }

  getStageIconClass(status: string): string {
    switch (status) {
      case "COMPLETED":
        return "check_circle"
      case "IN_PROGRESS":
        return "schedule"
      case "REJECTED":
        return "cancel"
      default:
        return "radio_button_unchecked"
    }
  }

  getStageIconColor(status: string): string {
    switch (status) {
      case "COMPLETED":
        return "completed"
      case "IN_PROGRESS":
        return "in-progress"
      case "REJECTED":
        return "rejected"
      default:
        return "pending"
    }
  }

  getWorkTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      REMOTE: "work-type-remote",
      HYBRID: "work-type-hybrid",
      ON_SITE: "work-type-onsite",
    }
    return classes[type] || classes["REMOTE"]
  }

  getProficiencyBorderClass(level: string): string {
    const classes: { [key: string]: string } = {
      JUNIOR: "proficiency-junior",
      MIDDLE: "proficiency-middle",
      SENIOR: "proficiency-senior",
      LEAD: "proficiency-lead",
    }
    return classes[level] || classes["MIDDLE"]
  }

  getSkillStatusColor(status: string): string {
    switch (status) {
      case "excellent":
        return "skill-excellent"
      case "good":
        return "skill-good"
      case "partial":
        return "skill-partial"
      case "missing":
        return "skill-missing"
      default:
        return "skill-default"
    }
  }

  getSkillStatusIcon(status: string): string {
    switch (status) {
      case "excellent":
      case "good":
        return "trending_up"
      case "partial":
        return "remove"
      case "missing":
        return "trending_down"
      default:
        return ""
    }
  }

  getSkillStatusIconColor(status: string): string {
    switch (status) {
      case "excellent":
      case "good":
        return "text-teal"
      case "partial":
        return "text-orange"
      case "missing":
        return "text-orange-dark"
      default:
        return ""
    }
  }

  getQuestionScoreClass(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "score-excellent"
    if (percentage >= 60) return "score-good"
    return "score-needs-improvement"
  }

  hasInterviewOrAssessment(stage: StageData): boolean {
    return !!stage.interviewDetails || stage.name === "ASSESSMENT"
  }
}


export interface Position {
  id: string
  positionName: string
  companyName: string
  proficiencyLevel: string
  workType: string
  appliedDate: Date
  currentStage: string
  skillMatch: number
  stages: StageData[]
}

export interface StageData {
  id: string
  name: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED"
  completedDate?: Date
  interviewDetails?: InterviewDetails
}

export interface InterviewDetails {
  interviewer: string
  interviewDate: Date
  duration: number
  score: number
  summary: string
  notes: string[]
  questions: InterviewQuestion[]
  feedback: string
  strengths: string[]
  areasForImprovement: string[]
}

export interface InterviewQuestion {
  question: string
  answer: string
  interpretation: string
  score: number
}

export interface SkillComparison {
  matchPercentage: number
  required: string[]
  confirmed: string[]
  missing: string[]
  detailedSkills: DetailedSkill[]
}

export interface DetailedSkill {
  name: string
  requiredLevel: number
  talentLevel: number
  matchPercentage: number
  status: "excellent" | "good" | "partial" | "missing"
  notes?: string
}

export interface Assessment {
  id: string
  assessmentName: string
  completedDate: Date
  duration: number
  totalScore: number
  maxScore: number
  percentage: number
  evaluator?: string
  feedback?: string
  questions: AssessmentQuestion[]
}

export interface AssessmentQuestion {
  id: string
  question: string
  type: "MULTIPLE_CHOICE" | "CODING_CHALLENGE" | "SHORT_ANSWER" | "ESSAY"
  answer: string
  score: number
  maxScore: number
  feedback?: string
}