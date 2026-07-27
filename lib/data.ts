import type { JourneyStageId, PipelineStatus } from "./journey"

/* ============================================================
   Domain models — mirror the intended MongoDB document shapes.
   ============================================================ */

export interface TalentElement {
  name: string
  score: number // 0-100 demonstrated strength
  evidence: "strong" | "moderate" | "needs-validation"
}

export interface WorkStyle {
  // Myers-Briggs style type indicator (approved, human-supervised assessment)
  mbti: string
  mbtiLabel: string
  discipline: number // structure vs. flexibility
  collaboration: number // independent vs. collaborative
  pace: number // reflective vs. fast
  focus: number // detail vs. big-picture
}

export interface Skill {
  name: string
  level: number // 0-100
  verified: boolean
  category: "core" | "nice-to-have"
}

export interface Candidate {
  id: string
  name: string
  title: string
  location: string
  avatarTone: string
  status: PipelineStatus
  jobId: string
  appliedAt: string
  source: string
  matchScore: number // Chemistry Match %
  chemistry: {
    role: number
    team: number
    org: number
  }
  elements: TalentElement[] // Talent Elements / Candidate Formula
  workStyle: WorkStyle // Team Chemistry inputs
  skills: Skill[]
  potentialSpectrum: { strengths: string[]; transferable: string[]; development: string[] }
  summary: string
  email: string
  phone: string
  experienceYears: number
  salaryExpectation: number
  redFlags: string[]
  tags: string[]
}

export interface Job {
  id: string
  title: string
  department: string
  location: string
  type: string
  status: "draft" | "pending-approval" | "published" | "closed"
  stage: JourneyStageId
  openings: number
  applicants: number
  inPipeline: number
  jdQuality: number
  salaryBand: [number, number]
  postedAt: string
  hiringManager: string
  recruiter: string
  priority: "high" | "medium" | "low"
  channels: { name: string; applicants: number; hires: number }[]
  skills: string[]
}

export interface Interview {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  type: "Prescreen" | "Technical" | "Live Coding" | "Behavioral" | "Panel" | "Final"
  mode: "Video" | "On-site" | "Phone"
  start: string
  durationMin: number
  interviewers: string[]
  status: "scheduled" | "completed" | "cancelled"
  scorecardDone?: boolean
}

export interface Offer {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  base: number
  bonus: number
  equity: string
  status: "draft" | "pending-approval" | "sent" | "accepted" | "declined"
  acceptanceLikelihood: number
  createdAt: string
  approvals: { role: string; name: string; status: "approved" | "pending" | "rejected" }[]
}

/* ============================================================
   Mock records
   ============================================================ */

export const JOBS: Job[] = [
  {
    id: "job-1",
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote · EU",
    type: "Full-time",
    status: "published",
    stage: "evaluate",
    openings: 2,
    applicants: 148,
    inPipeline: 34,
    jdQuality: 92,
    salaryBand: [78000, 96000],
    postedAt: "2026-07-02",
    hiringManager: "Diana Petrova",
    recruiter: "Marcus Lindqvist",
    priority: "high",
    channels: [
      { name: "LinkedIn", applicants: 71, hires: 2 },
      { name: "Referral", applicants: 22, hires: 3 },
      { name: "Career page", applicants: 38, hires: 1 },
      { name: "Workable", applicants: 17, hires: 0 },
    ],
    skills: ["React", "TypeScript", "Next.js", "Accessibility", "Design systems"],
  },
  {
    id: "job-2",
    title: "Product Designer",
    department: "Design",
    location: "Berlin · Hybrid",
    type: "Full-time",
    status: "published",
    stage: "match",
    openings: 1,
    applicants: 96,
    inPipeline: 21,
    jdQuality: 88,
    salaryBand: [62000, 78000],
    postedAt: "2026-07-08",
    hiringManager: "Ola Nordmann",
    recruiter: "Marcus Lindqvist",
    priority: "medium",
    channels: [
      { name: "LinkedIn", applicants: 44, hires: 1 },
      { name: "Dribbble", applicants: 29, hires: 1 },
      { name: "Referral", applicants: 12, hires: 0 },
      { name: "Career page", applicants: 11, hires: 0 },
    ],
    skills: ["Figma", "Design systems", "User research", "Prototyping"],
  },
  {
    id: "job-3",
    title: "Data Scientist",
    department: "Data & AI",
    location: "Remote · Global",
    type: "Full-time",
    status: "published",
    stage: "understand",
    openings: 1,
    applicants: 112,
    inPipeline: 18,
    jdQuality: 79,
    salaryBand: [90000, 120000],
    postedAt: "2026-07-11",
    hiringManager: "Sofia Almeida",
    recruiter: "Nadia Haddad",
    priority: "high",
    channels: [
      { name: "LinkedIn", applicants: 58, hires: 0 },
      { name: "GitHub", applicants: 27, hires: 1 },
      { name: "Referral", applicants: 15, hires: 1 },
      { name: "Career page", applicants: 12, hires: 0 },
    ],
    skills: ["Python", "ML", "SQL", "Statistics", "LLMs"],
  },
  {
    id: "job-4",
    title: "Engineering Manager",
    department: "Engineering",
    location: "London · Hybrid",
    type: "Full-time",
    status: "pending-approval",
    stage: "discover",
    openings: 1,
    applicants: 0,
    inPipeline: 0,
    jdQuality: 71,
    salaryBand: [110000, 140000],
    postedAt: "2026-07-24",
    hiringManager: "Tom Becker",
    recruiter: "Nadia Haddad",
    priority: "medium",
    channels: [],
    skills: ["Leadership", "People management", "System design", "Agile"],
  },
  {
    id: "job-5",
    title: "Customer Success Lead",
    department: "Revenue",
    location: "Remote · US",
    type: "Full-time",
    status: "published",
    stage: "decide",
    openings: 1,
    applicants: 63,
    inPipeline: 9,
    jdQuality: 85,
    salaryBand: [70000, 88000],
    postedAt: "2026-06-20",
    hiringManager: "Grace Kim",
    recruiter: "Marcus Lindqvist",
    priority: "low",
    channels: [
      { name: "LinkedIn", applicants: 33, hires: 0 },
      { name: "Referral", applicants: 18, hires: 1 },
      { name: "Career page", applicants: 12, hires: 0 },
    ],
    skills: ["SaaS", "Onboarding", "Account management", "Analytics"],
  },
]

function mkElements(v: number[]): TalentElement[] {
  const names = ["Analytical reasoning", "Communication", "Technical depth", "Leadership", "Adaptability", "Collaboration"]
  return names.map((name, i) => ({
    name,
    score: v[i],
    evidence: v[i] >= 82 ? "strong" : v[i] >= 68 ? "moderate" : "needs-validation",
  }))
}

export const CANDIDATES: Candidate[] = [
  {
    id: "cand-1",
    name: "Amara Okafor",
    title: "Senior Frontend Engineer",
    location: "Lisbon, PT",
    avatarTone: "#208e2d",
    status: "interview",
    jobId: "job-1",
    appliedAt: "2026-07-05",
    source: "Referral",
    matchScore: 94,
    chemistry: { role: 95, team: 91, org: 89 },
    elements: mkElements([92, 88, 95, 74, 86, 90]),
    workStyle: {
      mbti: "INTJ",
      mbtiLabel: "Architect",
      discipline: 82,
      collaboration: 64,
      pace: 71,
      focus: 78,
    },
    skills: [
      { name: "React", level: 95, verified: true, category: "core" },
      { name: "TypeScript", level: 92, verified: true, category: "core" },
      { name: "Next.js", level: 88, verified: true, category: "core" },
      { name: "Accessibility", level: 80, verified: false, category: "core" },
      { name: "Design systems", level: 84, verified: true, category: "nice-to-have" },
    ],
    potentialSpectrum: {
      strengths: ["Component architecture", "Performance optimization", "Mentoring"],
      transferable: ["Design collaboration", "Technical writing"],
      development: ["Public speaking", "Stakeholder negotiation"],
    },
    summary:
      "Demonstrates strong alignment with the role's frontend architecture requirements. Evidence for accessibility depth should be validated in the technical interview.",
    email: "amara.okafor@example.com",
    phone: "+351 91 234 5678",
    experienceYears: 8,
    salaryExpectation: 88000,
    redFlags: [],
    tags: ["Top match", "Referred by Diana P."],
  },
  {
    id: "cand-2",
    name: "Liam Chen",
    title: "Frontend Engineer",
    location: "Amsterdam, NL",
    avatarTone: "#126f66",
    status: "assessment",
    jobId: "job-1",
    appliedAt: "2026-07-09",
    source: "LinkedIn",
    matchScore: 87,
    chemistry: { role: 88, team: 85, org: 82 },
    elements: mkElements([84, 82, 88, 62, 80, 86]),
    workStyle: {
      mbti: "ENFP",
      mbtiLabel: "Campaigner",
      discipline: 58,
      collaboration: 83,
      pace: 76,
      focus: 62,
    },
    skills: [
      { name: "React", level: 88, verified: true, category: "core" },
      { name: "TypeScript", level: 82, verified: true, category: "core" },
      { name: "Next.js", level: 79, verified: false, category: "core" },
      { name: "Accessibility", level: 72, verified: false, category: "core" },
    ],
    potentialSpectrum: {
      strengths: ["Rapid prototyping", "Team energy", "UI polish"],
      transferable: ["Product thinking"],
      development: ["Testing discipline", "Architecture at scale"],
    },
    summary:
      "Strong collaborative energy and UI craft. Assessment should validate testing discipline and large-scale architecture experience.",
    email: "liam.chen@example.com",
    phone: "+31 6 1234 5678",
    experienceYears: 5,
    salaryExpectation: 74000,
    redFlags: ["Short tenure at last role (11 months)"],
    tags: ["Strong culture add"],
  },
  {
    id: "cand-3",
    name: "Priya Nair",
    title: "Product Designer",
    location: "Bangalore, IN",
    avatarTone: "#5b5585",
    status: "screening",
    jobId: "job-2",
    appliedAt: "2026-07-12",
    source: "Dribbble",
    matchScore: 91,
    chemistry: { role: 92, team: 90, org: 88 },
    elements: mkElements([86, 91, 78, 70, 88, 92]),
    workStyle: {
      mbti: "INFJ",
      mbtiLabel: "Advocate",
      discipline: 74,
      collaboration: 80,
      pace: 60,
      focus: 68,
    },
    skills: [
      { name: "Figma", level: 94, verified: true, category: "core" },
      { name: "Design systems", level: 90, verified: true, category: "core" },
      { name: "User research", level: 82, verified: false, category: "core" },
      { name: "Prototyping", level: 88, verified: true, category: "nice-to-have" },
    ],
    potentialSpectrum: {
      strengths: ["Systems thinking", "Craft", "Empathy-led research"],
      transferable: ["Facilitation", "Content design"],
      development: ["Quantitative analysis"],
    },
    summary:
      "Exceptional systems-design craft with research empathy. Screening confirms strong role fit; recommend fast-track to portfolio review.",
    email: "priya.nair@example.com",
    phone: "+91 98 8000 1234",
    experienceYears: 7,
    salaryExpectation: 70000,
    redFlags: [],
    tags: ["Portfolio standout"],
  },
  {
    id: "cand-4",
    name: "Mateus Silva",
    title: "Data Scientist",
    location: "São Paulo, BR",
    avatarTone: "#383c5b",
    status: "applied",
    jobId: "job-3",
    appliedAt: "2026-07-15",
    source: "GitHub",
    matchScore: 83,
    chemistry: { role: 85, team: 79, org: 81 },
    elements: mkElements([90, 74, 88, 60, 76, 72]),
    workStyle: {
      mbti: "ISTP",
      mbtiLabel: "Virtuoso",
      discipline: 68,
      collaboration: 52,
      pace: 66,
      focus: 82,
    },
    skills: [
      { name: "Python", level: 92, verified: true, category: "core" },
      { name: "ML", level: 86, verified: true, category: "core" },
      { name: "SQL", level: 84, verified: true, category: "core" },
      { name: "LLMs", level: 70, verified: false, category: "nice-to-have" },
    ],
    potentialSpectrum: {
      strengths: ["Model building", "Experimentation", "Open-source"],
      transferable: ["Data storytelling"],
      development: ["Stakeholder communication", "MLOps"],
    },
    summary:
      "Strong analytical and modeling evidence from open-source work. Communication and MLOps depth need validation.",
    email: "mateus.silva@example.com",
    phone: "+55 11 91234 5678",
    experienceYears: 6,
    salaryExpectation: 105000,
    redFlags: [],
    tags: ["Open-source contributor"],
  },
  {
    id: "cand-5",
    name: "Hannah Weber",
    title: "Senior Frontend Engineer",
    location: "Munich, DE",
    avatarTone: "#d1a18f",
    status: "decision",
    jobId: "job-1",
    appliedAt: "2026-06-28",
    source: "Career page",
    matchScore: 90,
    chemistry: { role: 91, team: 88, org: 92 },
    elements: mkElements([88, 90, 86, 82, 84, 88]),
    workStyle: {
      mbti: "ENTJ",
      mbtiLabel: "Commander",
      discipline: 86,
      collaboration: 70,
      pace: 80,
      focus: 74,
    },
    skills: [
      { name: "React", level: 90, verified: true, category: "core" },
      { name: "TypeScript", level: 89, verified: true, category: "core" },
      { name: "Next.js", level: 91, verified: true, category: "core" },
      { name: "Accessibility", level: 85, verified: true, category: "core" },
    ],
    potentialSpectrum: {
      strengths: ["Technical leadership", "Delivery", "Accessibility"],
      transferable: ["Team management"],
      development: ["Delegation"],
    },
    summary:
      "Consistently strong evidence across technical and leadership elements. Ready for hiring decision — panel feedback aligned positive.",
    email: "hannah.weber@example.com",
    phone: "+49 151 2345 6789",
    experienceYears: 9,
    salaryExpectation: 94000,
    redFlags: [],
    tags: ["Panel favorite", "Leadership potential"],
  },
  {
    id: "cand-6",
    name: "Yuki Tanaka",
    title: "Product Designer",
    location: "Tokyo, JP",
    avatarTone: "#24af4f",
    status: "offer",
    jobId: "job-2",
    appliedAt: "2026-06-15",
    source: "Referral",
    matchScore: 93,
    chemistry: { role: 94, team: 92, org: 90 },
    elements: mkElements([84, 92, 80, 76, 90, 94]),
    workStyle: {
      mbti: "ISFP",
      mbtiLabel: "Adventurer",
      discipline: 66,
      collaboration: 82,
      pace: 62,
      focus: 64,
    },
    skills: [
      { name: "Figma", level: 96, verified: true, category: "core" },
      { name: "Design systems", level: 92, verified: true, category: "core" },
      { name: "Prototyping", level: 90, verified: true, category: "core" },
    ],
    potentialSpectrum: {
      strengths: ["Visual craft", "Motion", "Collaboration"],
      transferable: ["Brand design"],
      development: ["Quant research"],
    },
    summary:
      "Outstanding craft and collaboration evidence. Offer stage — compensation approval routed to Finance.",
    email: "yuki.tanaka@example.com",
    phone: "+81 90 1234 5678",
    experienceYears: 6,
    salaryExpectation: 72000,
    redFlags: [],
    tags: ["Offer out"],
  },
  {
    id: "cand-7",
    name: "Sara Ahmadi",
    title: "Data Scientist",
    location: "Toronto, CA",
    avatarTone: "#126f66",
    status: "interview",
    jobId: "job-3",
    appliedAt: "2026-07-13",
    source: "LinkedIn",
    matchScore: 88,
    chemistry: { role: 89, team: 86, org: 84 },
    elements: mkElements([89, 82, 85, 68, 82, 80]),
    workStyle: {
      mbti: "INTP",
      mbtiLabel: "Logician",
      discipline: 62,
      collaboration: 58,
      pace: 64,
      focus: 86,
    },
    skills: [
      { name: "Python", level: 90, verified: true, category: "core" },
      { name: "ML", level: 88, verified: true, category: "core" },
      { name: "Statistics", level: 86, verified: true, category: "core" },
      { name: "LLMs", level: 78, verified: false, category: "nice-to-have" },
    ],
    potentialSpectrum: {
      strengths: ["Research rigor", "Statistics", "Curiosity"],
      transferable: ["Teaching"],
      development: ["Delivery pace"],
    },
    summary:
      "Deep research rigor and statistical foundation. Interview should validate delivery pace in a product environment.",
    email: "sara.ahmadi@example.com",
    phone: "+1 416 555 0199",
    experienceYears: 5,
    salaryExpectation: 102000,
    redFlags: [],
    tags: ["Strong researcher"],
  },
  {
    id: "cand-8",
    name: "David Okonkwo",
    title: "Customer Success Lead",
    location: "Austin, US",
    avatarTone: "#5b5585",
    status: "decision",
    jobId: "job-5",
    appliedAt: "2026-06-22",
    source: "Referral",
    matchScore: 86,
    chemistry: { role: 87, team: 88, org: 85 },
    elements: mkElements([80, 90, 66, 84, 86, 90]),
    workStyle: {
      mbti: "ESFJ",
      mbtiLabel: "Consul",
      discipline: 78,
      collaboration: 88,
      pace: 74,
      focus: 60,
    },
    skills: [
      { name: "SaaS", level: 88, verified: true, category: "core" },
      { name: "Onboarding", level: 90, verified: true, category: "core" },
      { name: "Account management", level: 86, verified: true, category: "core" },
      { name: "Analytics", level: 74, verified: false, category: "nice-to-have" },
    ],
    potentialSpectrum: {
      strengths: ["Relationship building", "Onboarding design", "Empathy"],
      transferable: ["Team leadership"],
      development: ["Data fluency"],
    },
    summary:
      "Excellent relationship and onboarding evidence. Data fluency to validate; strong culture and team-chemistry fit.",
    email: "david.okonkwo@example.com",
    phone: "+1 512 555 0143",
    experienceYears: 7,
    salaryExpectation: 82000,
    redFlags: [],
    tags: ["Culture add"],
  },
  {
    id: "cand-9",
    name: "Elena Rossi",
    title: "Frontend Engineer",
    location: "Milan, IT",
    avatarTone: "#208e2d",
    status: "sourced",
    jobId: "job-1",
    appliedAt: "2026-07-22",
    source: "AI Sourcing",
    matchScore: 82,
    chemistry: { role: 84, team: 80, org: 78 },
    elements: mkElements([80, 78, 84, 60, 78, 80]),
    workStyle: {
      mbti: "ISTJ",
      mbtiLabel: "Logistician",
      discipline: 88,
      collaboration: 60,
      pace: 62,
      focus: 80,
    },
    skills: [
      { name: "React", level: 84, verified: false, category: "core" },
      { name: "TypeScript", level: 80, verified: false, category: "core" },
      { name: "Vue", level: 86, verified: true, category: "nice-to-have" },
    ],
    potentialSpectrum: {
      strengths: ["Reliability", "Attention to detail"],
      transferable: ["React (from Vue)"],
      development: ["Next.js ecosystem"],
    },
    summary:
      "Surfaced by AI talent radar — signals readiness to move. Solid fundamentals; React/Next evidence to validate.",
    email: "elena.rossi@example.com",
    phone: "+39 333 123 4567",
    experienceYears: 6,
    salaryExpectation: 68000,
    redFlags: [],
    tags: ["AI-sourced", "Passive candidate"],
  },
  {
    id: "cand-10",
    name: "Noah Bergström",
    title: "Senior Frontend Engineer",
    location: "Stockholm, SE",
    avatarTone: "#383c5b",
    status: "screening",
    jobId: "job-1",
    appliedAt: "2026-07-14",
    source: "LinkedIn",
    matchScore: 79,
    chemistry: { role: 80, team: 78, org: 76 },
    elements: mkElements([76, 80, 78, 66, 74, 82]),
    workStyle: {
      mbti: "ENFJ",
      mbtiLabel: "Protagonist",
      discipline: 70,
      collaboration: 86,
      pace: 72,
      focus: 60,
    },
    skills: [
      { name: "React", level: 80, verified: true, category: "core" },
      { name: "TypeScript", level: 74, verified: false, category: "core" },
      { name: "Next.js", level: 70, verified: false, category: "core" },
    ],
    potentialSpectrum: {
      strengths: ["Communication", "Mentoring"],
      transferable: ["Team lead"],
      development: ["Advanced TypeScript"],
    },
    summary:
      "Warm communicator with mentoring strength. Technical depth in TypeScript/Next to validate before advancing.",
    email: "noah.bergstrom@example.com",
    phone: "+46 70 123 4567",
    experienceYears: 8,
    salaryExpectation: 90000,
    redFlags: ["Salary expectation above band"],
    tags: [],
  },
]

export const INTERVIEWS: Interview[] = [
  {
    id: "int-1",
    candidateId: "cand-1",
    candidateName: "Amara Okafor",
    jobTitle: "Senior Frontend Engineer",
    type: "Technical",
    mode: "Video",
    start: "2026-07-27T14:00:00",
    durationMin: 60,
    interviewers: ["Diana Petrova", "Marcus Lindqvist"],
    status: "scheduled",
  },
  {
    id: "int-2",
    candidateId: "cand-1",
    candidateName: "Amara Okafor",
    jobTitle: "Senior Frontend Engineer",
    type: "Live Coding",
    mode: "Video",
    start: "2026-07-29T10:00:00",
    durationMin: 90,
    interviewers: ["Erik Sund"],
    status: "scheduled",
  },
  {
    id: "int-3",
    candidateId: "cand-7",
    candidateName: "Sara Ahmadi",
    jobTitle: "Data Scientist",
    type: "Technical",
    mode: "Video",
    start: "2026-07-27T16:30:00",
    durationMin: 60,
    interviewers: ["Sofia Almeida"],
    status: "scheduled",
  },
  {
    id: "int-4",
    candidateId: "cand-5",
    candidateName: "Hannah Weber",
    jobTitle: "Senior Frontend Engineer",
    type: "Panel",
    mode: "Video",
    start: "2026-07-25T11:00:00",
    durationMin: 75,
    interviewers: ["Diana Petrova", "Erik Sund", "Marcus Lindqvist"],
    status: "completed",
    scorecardDone: true,
  },
  {
    id: "int-5",
    candidateId: "cand-3",
    candidateName: "Priya Nair",
    jobTitle: "Product Designer",
    type: "Prescreen",
    mode: "Phone",
    start: "2026-07-28T09:30:00",
    durationMin: 30,
    interviewers: ["Marcus Lindqvist"],
    status: "scheduled",
  },
  {
    id: "int-6",
    candidateId: "cand-8",
    candidateName: "David Okonkwo",
    jobTitle: "Customer Success Lead",
    type: "Behavioral",
    mode: "Video",
    start: "2026-07-24T15:00:00",
    durationMin: 45,
    interviewers: ["Grace Kim"],
    status: "completed",
    scorecardDone: false,
  },
]

export const OFFERS: Offer[] = [
  {
    id: "offer-1",
    candidateId: "cand-6",
    candidateName: "Yuki Tanaka",
    jobTitle: "Product Designer",
    base: 74000,
    bonus: 6000,
    equity: "0.05%",
    status: "sent",
    acceptanceLikelihood: 82,
    createdAt: "2026-07-23",
    approvals: [
      { role: "Hiring Manager", name: "Ola Nordmann", status: "approved" },
      { role: "Finance", name: "R. Alvarez", status: "approved" },
      { role: "VP People", name: "K. Osei", status: "pending" },
    ],
  },
  {
    id: "offer-2",
    candidateId: "cand-5",
    candidateName: "Hannah Weber",
    jobTitle: "Senior Frontend Engineer",
    base: 94000,
    bonus: 9000,
    equity: "0.08%",
    status: "draft",
    acceptanceLikelihood: 74,
    createdAt: "2026-07-26",
    approvals: [
      { role: "Hiring Manager", name: "Diana Petrova", status: "approved" },
      { role: "Finance", name: "R. Alvarez", status: "pending" },
      { role: "VP People", name: "K. Osei", status: "pending" },
    ],
  },
]

/* ============================================================
   Analytics
   ============================================================ */

export const FUNNEL = [
  { stage: "Sourced", value: 420, color: "#5b5585" },
  { stage: "Applied", value: 268, color: "#208e2d" },
  { stage: "Screening", value: 142, color: "#545454" },
  { stage: "Assessment", value: 88, color: "#24af4f" },
  { stage: "Interview", value: 46, color: "#4fd1a8" },
  { stage: "Decision", value: 21, color: "#d1a18f" },
  { stage: "Offer", value: 12, color: "#ae0301" },
  { stage: "Hired", value: 9, color: "#176b25" },
]

export const HIRING_TREND = [
  { month: "Feb", hires: 4, applications: 180, timeToHire: 38 },
  { month: "Mar", hires: 6, applications: 210, timeToHire: 35 },
  { month: "Apr", hires: 5, applications: 240, timeToHire: 33 },
  { month: "May", hires: 8, applications: 290, timeToHire: 31 },
  { month: "Jun", hires: 7, applications: 320, timeToHire: 29 },
  { month: "Jul", hires: 9, applications: 358, timeToHire: 27 },
]

export const SOURCE_EFFECTIVENESS = [
  { source: "Referral", hires: 9, quality: 92 },
  { source: "LinkedIn", hires: 6, quality: 78 },
  { source: "Career page", hires: 3, quality: 74 },
  { source: "AI Sourcing", hires: 4, quality: 85 },
  { source: "GitHub", hires: 2, quality: 88 },
  { source: "Workable", hires: 1, quality: 62 },
]

export const RECRUITER_PERFORMANCE = [
  { name: "Marcus Lindqvist", filled: 12, timeToHire: 26, nps: 74, velocity: 88 },
  { name: "Nadia Haddad", filled: 9, timeToHire: 29, nps: 68, velocity: 81 },
  { name: "Priya Sharma", filled: 7, timeToHire: 31, nps: 71, velocity: 76 },
]

/* Team hierarchy — HR Director tracking team performance */
export const TEAM_HIERARCHY = {
  director: { name: "Isabella Moreau", role: "HR Director" },
  managers: [
    {
      name: "Marcus Lindqvist",
      role: "Recruitment Manager",
      openReqs: 8,
      filledQtr: 12,
      team: ["Priya Sharma", "Jonas Weber"],
    },
    {
      name: "Nadia Haddad",
      role: "Talent Manager",
      openReqs: 5,
      filledQtr: 9,
      team: ["Aisha Bello"],
    },
  ],
}

/* External dashboard connectors (PostHog, GA, HotJar, Stripe, etc.) */
export const EXTERNAL_DASHBOARDS = [
  { name: "PostHog", category: "Product analytics", status: "connected", metric: "2,481 events / day" },
  { name: "Google Analytics", category: "Traffic", status: "connected", metric: "12.4k sessions / mo" },
  { name: "HotJar", category: "Session recording", status: "connected", metric: "318 recordings" },
  { name: "Stripe", category: "Billing", status: "connected", metric: "€48.2k MRR" },
  { name: "LinkedIn Recruiter", category: "Sourcing", status: "connected", metric: "71 InMails sent" },
  { name: "Workable ATS", category: "ATS sync", status: "syncing", metric: "Last sync 4m ago" },
  { name: "Elasticsearch", category: "Search", status: "connected", metric: "1.2M docs indexed" },
  { name: "Glassdoor", category: "Employer brand", status: "action-needed", metric: "Rating drop 4.3→4.1" },
]

/* Activity feed */
export const ACTIVITY = [
  { id: 1, actor: "Amara Okafor", action: "advanced to Interview", target: "Senior Frontend Engineer", time: "2026-07-27T09:12:00", tone: "green" as const },
  { id: 2, actor: "AI Sourcing Agent", action: "surfaced 3 passive candidates for", target: "Senior Frontend Engineer", time: "2026-07-27T08:40:00", tone: "violet" as const },
  { id: 3, actor: "Diana Petrova", action: "submitted a scorecard for", target: "Hannah Weber", time: "2026-07-26T17:05:00", tone: "teal" as const },
  { id: 4, actor: "Yuki Tanaka", action: "received an offer for", target: "Product Designer", time: "2026-07-23T14:20:00", tone: "red" as const },
  { id: 5, actor: "Pipeline Copilot", action: "flagged a stalled pipeline in", target: "Data Scientist", time: "2026-07-26T11:00:00", tone: "amber" as const },
]

/* Helpers */
export const getCandidate = (id: string) => CANDIDATES.find((c) => c.id === id)
export const getJob = (id: string) => JOBS.find((j) => j.id === id)
export const candidatesByJob = (jobId: string) => CANDIDATES.filter((c) => c.jobId === jobId)
export const candidatesByStatus = (status: PipelineStatus) =>
  CANDIDATES.filter((c) => c.status === status)
