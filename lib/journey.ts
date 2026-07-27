import {
  Compass,
  Megaphone,
  Brain,
  GitCompareArrows,
  ClipboardCheck,
  Scale,
  FileSignature,
  type LucideIcon,
} from "lucide-react"

/** The seven experience stages of the Talemistry Recruitment Journey. */
export type JourneyStageId =
  | "discover"
  | "attract"
  | "understand"
  | "match"
  | "evaluate"
  | "decide"
  | "offer"

export interface JourneyStage {
  id: JourneyStageId
  index: number
  name: string
  icon: LucideIcon
  color: string
  scope: string
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "discover",
    index: 1,
    name: "Discover",
    icon: Compass,
    color: "#383c5b",
    scope:
      "Define hiring needs, create jobs, approve vacancies, publish to job boards, search talent pools and source candidates.",
  },
  {
    id: "attract",
    index: 2,
    name: "Attract",
    icon: Megaphone,
    color: "#126f66",
    scope:
      "Present opportunities, operate career pages, receive applications, manage referrals and measure source effectiveness.",
  },
  {
    id: "understand",
    index: 3,
    name: "Understand",
    icon: Brain,
    color: "#5b5585",
    scope:
      "Parse resumes, extract skills, collect questionnaires, review motivation and support approved work-style or psychometric assessments.",
  },
  {
    id: "match",
    index: 4,
    name: "Match",
    icon: GitCompareArrows,
    color: "#24af4f",
    scope:
      "Compare the candidate formula with the role formula, explain alignment and highlight evidence still requiring validation.",
  },
  {
    id: "evaluate",
    index: 5,
    name: "Evaluate",
    icon: ClipboardCheck,
    color: "#4fd1a8",
    scope:
      "Run prescreens, schedule interviews, use structured guides, collect scorecards and consolidate technical or behavioral evidence.",
  },
  {
    id: "decide",
    index: 6,
    name: "Decide",
    icon: Scale,
    color: "#d1a18f",
    scope:
      "Compare candidates, resolve conflicting feedback, document rationale and complete approval workflows.",
  },
  {
    id: "offer",
    index: 7,
    name: "Offer",
    icon: FileSignature,
    color: "#ae0301",
    scope:
      "Generate offers, route compensation approvals, communicate terms, collect acceptance and close the recruitment process.",
  },
]

export const stageById = (id: JourneyStageId) => JOURNEY_STAGES.find((s) => s.id === id)!

/** Operational pipeline statuses (more granular than the 7 experience stages). */
export type PipelineStatus =
  | "sourced"
  | "applied"
  | "screening"
  | "assessment"
  | "interview"
  | "decision"
  | "offer"
  | "hired"
  | "rejected"

export interface PipelineStageMeta {
  id: PipelineStatus
  name: string
  color: string
  stage: JourneyStageId
}

export const PIPELINE_STAGES: PipelineStageMeta[] = [
  { id: "sourced", name: "Sourced", color: "#5b5585", stage: "discover" },
  { id: "applied", name: "Applied", color: "#208e2d", stage: "attract" },
  { id: "screening", name: "Screening", color: "#545454", stage: "understand" },
  { id: "assessment", name: "Assessment", color: "#24af4f", stage: "understand" },
  { id: "interview", name: "Interview", color: "#4fd1a8", stage: "evaluate" },
  { id: "decision", name: "Decision", color: "#d1a18f", stage: "decide" },
  { id: "offer", name: "Offer", color: "#ae0301", stage: "offer" },
  { id: "hired", name: "Hired", color: "#176b25", stage: "offer" },
]

export const pipelineStageById = (id: PipelineStatus) =>
  PIPELINE_STAGES.find((s) => s.id === id)
