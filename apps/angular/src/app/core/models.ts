export const JOURNEY_STAGES = [
  { key: 'discover', label: 'Discover', color: '#0B1F3A' },
  { key: 'attract', label: 'Attract', color: '#1E5AA8' },
  { key: 'understand', label: 'Understand', color: '#2E8B8B' },
  { key: 'match', label: 'Match', color: '#3BAA6B' },
  { key: 'evaluate', label: 'Evaluate', color: '#C9822E' },
  { key: 'decide', label: 'Decide', color: '#8A5CC4' },
  { key: 'offer', label: 'Offer', color: '#2FA84F' },
] as const

export type StageKey = (typeof JOURNEY_STAGES)[number]['key']

export interface WorkStyleAxis {
  key: string
  left: string
  right: string
  value: number
}

export interface TalentElement {
  name: string
  score: number
}

export interface Candidate {
  id: string
  name: string
  title: string
  location: string
  avatarTone: string
  stage: StageKey
  matchScore: number
  chemistryMatch: number
  potentialLow: number
  potentialHigh: number
  workStyleType: string
  workStyle: WorkStyleAxis[]
  elements: TalentElement[]
  skills: { name: string; level: number; verified: boolean }[]
  tags: string[]
  jobId: string
  updatedAt: string
}

export interface Job {
  id: string
  title: string
  team: string
  location: string
  employmentType: string
  status: string
  applicants: number
  inPipeline: number
  chemistryFit: number
  postedAt: string
}

export interface PipelineColumn {
  stage: StageKey
  label: string
  color: string
  candidates: Candidate[]
}

export interface DashboardMetrics {
  activeCandidates: number
  openRoles: number
  avgTimeToHire: number
  offerAcceptRate: number
  stageCounts: { stage: StageKey; label: string; color: string; count: number }[]
  hiringTrend: { label: string; hires: number; applicants: number }[]
}
