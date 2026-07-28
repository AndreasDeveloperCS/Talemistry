import { FUNNEL } from "@/lib/data"

/* ------------------------------------------------------------------ *
 * Talemistry — Analytics model
 *
 * A small, self-consistent synthetic model so the analytics dashboard
 * filters (time range, reporting scope, recruiter, skill set) produce
 * believable, internally-consistent numbers. Everything is derived
 * deterministically from the selected filters.
 * ------------------------------------------------------------------ */

/* ---------- Org hierarchy (who reports to whom) ------------------- */

export interface Person {
  id: string
  name: string
  role: string
  /** id of the supervisor this person reports to (null for the top) */
  managerId: string | null
  /** share of total hiring volume this person personally carries */
  share: number
  timeToHire: number
  nps: number
  velocity: number
}

export const PEOPLE: Person[] = [
  { id: "dir-1", name: "Isabella Moreau", role: "HR Director", managerId: null, share: 0, timeToHire: 29, nps: 71, velocity: 80 },
  { id: "mgr-1", name: "Marcus Lindqvist", role: "Recruitment Manager", managerId: "dir-1", share: 0.24, timeToHire: 26, nps: 74, velocity: 88 },
  { id: "mgr-2", name: "Nadia Haddad", role: "Talent Manager", managerId: "dir-1", share: 0.2, timeToHire: 29, nps: 68, velocity: 81 },
  { id: "rec-1", name: "Priya Sharma", role: "Senior Recruiter", managerId: "mgr-1", share: 0.18, timeToHire: 31, nps: 71, velocity: 76 },
  { id: "rec-2", name: "Jonas Weber", role: "Technical Recruiter", managerId: "mgr-1", share: 0.2, timeToHire: 28, nps: 70, velocity: 83 },
  { id: "rec-3", name: "Aisha Bello", role: "Sourcing Specialist", managerId: "mgr-2", share: 0.18, timeToHire: 33, nps: 66, velocity: 72 },
]

const byId = (id: string) => PEOPLE.find((p) => p.id === id)

/** People who can view/own a report — the HR Director and the managers. */
export const VIEWERS = PEOPLE.filter((p) => p.managerId === null || p.role.includes("Manager"))

function descendantsOf(viewerId: string): Person[] {
  const direct = PEOPLE.filter((p) => p.managerId === viewerId)
  return direct.reduce<Person[]>((acc, d) => acc.concat(d, descendantsOf(d.id)), [])
}

/** Volume-carrying people within a viewer's org (the viewer + everyone below). */
export function carriersForViewer(viewerId: string): Person[] {
  const viewer = byId(viewerId)
  if (!viewer) return []
  const chain = [viewer, ...descendantsOf(viewerId)]
  return chain.filter((p) => p.share > 0)
}

function scopePeople(viewerId: string, recruiterId: string): Person[] {
  if (recruiterId !== "all") {
    const p = byId(recruiterId)
    return p ? [p] : carriersForViewer(viewerId)
  }
  return carriersForViewer(viewerId)
}

/* ---------- Skill sets -------------------------------------------- */

export interface SkillSet {
  key: string
  label: string
  /** fraction of overall hiring volume attributable to this skill set */
  factor: number
  /** days added to (or removed from) time-to-hire */
  ttHOffset: number
  /** quality-of-hire adjustment */
  qualityOffset: number
}

export const SKILL_SETS: SkillSet[] = [
  { key: "all", label: "All skill sets", factor: 1, ttHOffset: 0, qualityOffset: 0 },
  { key: "frontend", label: "Frontend Engineering", factor: 0.28, ttHOffset: 0, qualityOffset: 0.2 },
  { key: "backend", label: "Backend Engineering", factor: 0.22, ttHOffset: 2, qualityOffset: 0.1 },
  { key: "data", label: "Data Science & ML", factor: 0.16, ttHOffset: 5, qualityOffset: 0.3 },
  { key: "design", label: "Product Design", factor: 0.14, ttHOffset: -2, qualityOffset: 0.1 },
  { key: "devops", label: "DevOps & SRE", factor: 0.1, ttHOffset: 6, qualityOffset: 0.4 },
  { key: "pm", label: "Product Management", factor: 0.1, ttHOffset: 3, qualityOffset: 0 },
]

/* ---------- Time ranges ------------------------------------------- */

export type RangeKey = "90d" | "6m" | "12m" | "ytd"

export const TIME_RANGES: { key: RangeKey; label: string; months: number }[] = [
  { key: "90d", label: "Last 90 days", months: 3 },
  { key: "6m", label: "Last 6 months", months: 6 },
  { key: "ytd", label: "Year to date", months: 7 },
  { key: "12m", label: "Last 12 months", months: 12 },
]

/* Rolling 12 months of baseline volume (oldest → newest). */
const MONTHS = [
  { label: "Aug", applications: 150, hires: 3, timeToHire: 40 },
  { label: "Sep", applications: 165, hires: 4, timeToHire: 39 },
  { label: "Oct", applications: 172, hires: 4, timeToHire: 38 },
  { label: "Nov", applications: 158, hires: 3, timeToHire: 40 },
  { label: "Dec", applications: 120, hires: 2, timeToHire: 42 },
  { label: "Jan", applications: 140, hires: 3, timeToHire: 39 },
  { label: "Feb", applications: 180, hires: 4, timeToHire: 38 },
  { label: "Mar", applications: 210, hires: 6, timeToHire: 35 },
  { label: "Apr", applications: 240, hires: 5, timeToHire: 33 },
  { label: "May", applications: 290, hires: 8, timeToHire: 31 },
  { label: "Jun", applications: 320, hires: 7, timeToHire: 29 },
  { label: "Jul", applications: 358, hires: 9, timeToHire: 27 },
]
const TOTAL_APPS_12 = MONTHS.reduce((s, m) => s + m.applications, 0)

const SOURCES_BASE = [
  { label: "Referral", value: 9, quality: 92, color: "#208e2d" },
  { label: "LinkedIn", value: 6, quality: 78, color: "#4fd1a8" },
  { label: "Career page", value: 3, quality: 74, color: "#5b5585" },
  { label: "AI Sourcing", value: 4, quality: 85, color: "#24af4f" },
  { label: "GitHub", value: 2, quality: 88, color: "#d1a18f" },
  { label: "Workable", value: 1, quality: 62, color: "#545454" },
]

/* ---------- Filters + compute ------------------------------------- */

export interface AnalyticsFilters {
  range: RangeKey
  viewerId: string
  recruiterId: string
  skill: string
}

export const DEFAULT_FILTERS: AnalyticsFilters = {
  range: "12m",
  viewerId: "dir-1",
  recruiterId: "all",
  skill: "all",
}

interface Kpi {
  value: string
  delta: string
  positive: boolean
}

function sumWindow(months: typeof MONTHS, scale: number) {
  const applications = months.reduce((s, m) => s + m.applications, 0) * scale
  const hires = months.reduce((s, m) => s + m.hires, 0) * scale
  return { applications, hires }
}

export function computeAnalytics(f: AnalyticsFilters) {
  const range = TIME_RANGES.find((r) => r.key === f.range) ?? TIME_RANGES[3]
  const skill = SKILL_SETS.find((s) => s.key === f.skill) ?? SKILL_SETS[0]
  const scope = scopePeople(f.viewerId, f.recruiterId)

  const shareFactor = scope.reduce((s, p) => s + p.share, 0)
  const scale = shareFactor * skill.factor

  const start = MONTHS.length - range.months
  const sliced = MONTHS.slice(Math.max(0, start))
  const prevSliced = start > 0 ? MONTHS.slice(Math.max(0, start - range.months), start) : []

  /* Trend + time-to-hire series */
  const trend = sliced.map((m) => ({
    label: m.label,
    applicants: Math.max(0, Math.round(m.applications * scale)),
    hires: Math.max(0, Math.round(m.hires * scale)),
  }))

  const avgScopeTtH = scope.length
    ? scope.reduce((s, p) => s + p.timeToHire * p.share, 0) / (shareFactor || 1)
    : 29
  const tth = sliced.map((m, i) => {
    // Blend the month's global trend with the scope/skill characteristics.
    const drift = (m.timeToHire - 33) * 0.6
    return { label: m.label, days: Math.max(12, Math.round(avgScopeTtH + skill.ttHOffset + drift + (sliced.length - 1 - i) * 0.4)) }
  })

  /* KPIs */
  const cur = sumWindow(sliced, scale)
  const prev = sumWindow(prevSliced.length ? prevSliced : sliced, scale)

  const curConv = cur.applications ? (cur.hires / cur.applications) * 100 : 0
  const prevConv = prev.applications ? (prev.hires / prev.applications) * 100 : 0

  const curTtHMonths = sliced.reduce((s, m) => s + m.timeToHire, 0) / (sliced.length || 1)
  const prevTtHMonths = (prevSliced.length ? prevSliced : sliced).reduce((s, m) => s + m.timeToHire, 0) / ((prevSliced.length || sliced.length) || 1)

  const appsDeltaPct = prev.applications ? ((cur.applications - prev.applications) / prev.applications) * 100 : 0
  const convDeltaPp = curConv - prevConv
  const ttHDeltaDays = prevTtHMonths - curTtHMonths // positive = improved (fewer days)

  const avgVelocity = scope.length ? scope.reduce((s, p) => s + p.velocity, 0) / scope.length : 80
  const quality = Math.min(9.8, Math.max(6, 8.4 + skill.qualityOffset + (avgVelocity - 80) / 40))
  const qualityDelta = Math.round((convDeltaPp * 0.3 + 0.2) * 10) / 10

  const kpis: { applications: Kpi; conversion: Kpi; timeToHire: Kpi; quality: Kpi } = {
    applications: {
      value: Math.round(cur.applications).toLocaleString(),
      delta: `${appsDeltaPct >= 0 ? "+" : ""}${appsDeltaPct.toFixed(0)}%`,
      positive: appsDeltaPct >= 0,
    },
    conversion: {
      value: `${curConv.toFixed(1)}%`,
      delta: `${convDeltaPp >= 0 ? "+" : ""}${convDeltaPp.toFixed(1)}%`,
      positive: convDeltaPp >= 0,
    },
    timeToHire: {
      value: `${Math.round(avgScopeTtH + skill.ttHOffset)}d`,
      delta: `${Math.abs(ttHDeltaDays).toFixed(0)}d`,
      positive: ttHDeltaDays >= 0,
    },
    quality: {
      value: quality.toFixed(1),
      delta: `${qualityDelta >= 0 ? "+" : ""}${qualityDelta.toFixed(1)}`,
      positive: qualityDelta >= 0,
    },
  }

  /* Funnel + sources scaled to the window & scope */
  const windowAppShare = sliced.reduce((s, m) => s + m.applications, 0) / TOTAL_APPS_12
  const volScale = windowAppShare * scale

  const funnel = FUNNEL.map((s) => ({
    label: s.stage,
    value: Math.max(0, Math.round(s.value * volScale)),
    color: s.color,
  }))

  const sources = SOURCES_BASE.map((s) => ({
    label: s.label,
    value: Math.max(0, Math.round(s.value * volScale * 6)),
    color: s.color,
  }))

  const sourceQuality = SOURCES_BASE.map((s) => ({
    source: s.label,
    quality: Math.min(99, Math.round(s.quality + skill.qualityOffset * 4)),
  }))

  /* Per-recruiter performance within scope */
  const windowHiresBase = sliced.reduce((s, m) => s + m.hires, 0)
  const recruiters = scope.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    filled: Math.max(0, Math.round(windowHiresBase * p.share * skill.factor)),
    timeToHire: Math.round(p.timeToHire + skill.ttHOffset),
    nps: p.nps,
    velocity: p.velocity,
  }))

  /* Human-readable scope label */
  const viewer = byId(f.viewerId)
  const recruiter = f.recruiterId === "all" ? null : byId(f.recruiterId)
  const scopeLabel = recruiter
    ? `${recruiter.name} · ${recruiter.role}`
    : `${viewer?.name ?? "Org"}'s org · ${scope.length} team member${scope.length === 1 ? "" : "s"}`

  return { kpis, trend, tth, funnel, sources, sourceQuality, recruiters, scopeLabel, range, skill }
}
