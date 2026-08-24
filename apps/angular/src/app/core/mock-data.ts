import { Candidate, DashboardMetrics, Job, JOURNEY_STAGES, StageKey } from './models'

const tones = ['#1E5AA8', '#2E8B8B', '#3BAA6B', '#C9822E', '#8A5CC4', '#0B1F3A']

function elements(seed: number): { name: string; score: number }[] {
  const names = ['Craft', 'Collaboration', 'Ownership', 'Learning', 'Communication', 'Impact']
  return names.map((name, i) => ({ name, score: 60 + ((seed * (i + 3)) % 40) }))
}

function workStyle(seed: number) {
  const axes = [
    { key: 'energy', left: 'Reflective', right: 'Expressive' },
    { key: 'cognition', left: 'Concrete', right: 'Conceptual' },
    { key: 'decisions', left: 'Analytical', right: 'Empathetic' },
    { key: 'structure', left: 'Flexible', right: 'Structured' },
  ]
  return axes.map((a, i) => ({ ...a, value: 25 + ((seed * (i + 2) * 13) % 60) }))
}

const NAMES = [
  ['Amara Okafor', 'Senior Frontend Engineer', 'Lisbon, PT'],
  ['Devon Reyes', 'Product Designer', 'Austin, US'],
  ['Mei Lin', 'Staff Backend Engineer', 'Singapore'],
  ['Jonas Brandt', 'Engineering Manager', 'Berlin, DE'],
  ['Priya Nair', 'Data Scientist', 'Bengaluru, IN'],
  ['Sofia Castellanos', 'Product Manager', 'Madrid, ES'],
  ['Noah Bergström', 'DevOps Engineer', 'Stockholm, SE'],
  ['Lena Haddad', 'UX Researcher', 'Amsterdam, NL'],
  ['Tobias Meyer', 'Full-Stack Engineer', 'Munich, DE'],
  ['Zara Ahmed', 'Security Engineer', 'Dubai, AE'],
  ['Marcus Webb', 'Solutions Architect', 'London, UK'],
  ['Yuki Tanaka', 'Mobile Engineer', 'Tokyo, JP'],
]

const TYPES = ['Architect', 'Catalyst', 'Navigator', 'Builder', 'Strategist', 'Connector']

export const MOCK_CANDIDATES: Candidate[] = NAMES.map((n, i) => {
  const stage = JOURNEY_STAGES[i % JOURNEY_STAGES.length].key as StageKey
  const match = 68 + ((i * 7) % 30)
  return {
    id: `cand-${i + 1}`,
    name: n[0],
    title: n[1],
    location: n[2],
    avatarTone: tones[i % tones.length],
    stage,
    matchScore: match,
    chemistryMatch: Math.min(98, match + 4),
    potentialLow: match - 8,
    potentialHigh: Math.min(99, match + 11),
    workStyleType: TYPES[i % TYPES.length],
    workStyle: workStyle(i + 1),
    elements: elements(i + 1),
    skills: [
      { name: 'TypeScript', level: 80 + (i % 15), verified: true },
      { name: 'System Design', level: 70 + (i % 20), verified: i % 2 === 0 },
      { name: 'Communication', level: 75 + (i % 18), verified: true },
    ],
    tags: ['Remote-ready', i % 2 ? 'Referred' : 'Inbound', 'EU work auth'],
    jobId: `job-${(i % 4) + 1}`,
    updatedAt: new Date(Date.now() - i * 3600_000 * 6).toISOString(),
  }
})

export const MOCK_JOBS: Job[] = [
  ['job-1', 'Senior Frontend Engineer', 'Product Engineering', 'Remote — EU', 'Full-time', 'published', 142, 24, 88],
  ['job-2', 'Staff Backend Engineer', 'Platform', 'Berlin / Hybrid', 'Full-time', 'published', 98, 18, 84],
  ['job-3', 'Product Designer', 'Design', 'Remote — Global', 'Full-time', 'published', 176, 21, 90],
  ['job-4', 'Engineering Manager', 'Product Engineering', 'London / Hybrid', 'Full-time', 'draft', 54, 9, 79],
].map((r) => ({
  id: r[0] as string,
  title: r[1] as string,
  team: r[2] as string,
  location: r[3] as string,
  employmentType: r[4] as string,
  status: r[5] as string,
  applicants: r[6] as number,
  inPipeline: r[7] as number,
  chemistryFit: r[8] as number,
  postedAt: '2026-06-12',
}))

export const MOCK_METRICS: DashboardMetrics = {
  activeCandidates: MOCK_CANDIDATES.length,
  openRoles: MOCK_JOBS.filter((j) => j.status === 'published').length,
  avgTimeToHire: 27,
  offerAcceptRate: 86,
  stageCounts: JOURNEY_STAGES.map((s) => ({
    stage: s.key as StageKey,
    label: s.label,
    color: s.color,
    count: MOCK_CANDIDATES.filter((c) => c.stage === s.key).length + (s.key === 'understand' ? 3 : 1),
  })),
  hiringTrend: [
    { label: 'Jan', hires: 4, applicants: 120 },
    { label: 'Feb', hires: 6, applicants: 148 },
    { label: 'Mar', hires: 5, applicants: 132 },
    { label: 'Apr', hires: 8, applicants: 176 },
    { label: 'May', hires: 7, applicants: 165 },
    { label: 'Jun', hires: 9, applicants: 190 },
  ],
}
