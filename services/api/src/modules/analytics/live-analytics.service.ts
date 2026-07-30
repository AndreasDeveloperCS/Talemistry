import { Injectable } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'

/* ------------------------------------------------------------------ *
 * Talemistry — LIVE analytics (read-only) against the real `evryka` DB.
 *
 * This service reads the ACTUAL production-style collections that hold
 * data today — `talent-pipeline-progress`, `users`, `talent-profile`,
 * `candidate-profile` — rather than the empty demo collections. It never
 * writes. The dataset is small so we read scoped docs once and aggregate
 * in memory, which also sidesteps the mixed string/ObjectId id storage.
 *
 * The output shape mirrors the Next.js `lib/analytics-live.ts` so the two
 * backends are interchangeable behind the same UI.
 * ------------------------------------------------------------------ */

export interface LiveFilters {
  range: string
  viewerId: string
  recruiterId: string
  skill: string
}

const RANGE_MONTHS: Record<string, number> = { '90d': 3, '6m': 6, ytd: 12, '12m': 12 }

const STAGE_ORDER = ['Sourced', 'Applied', 'Screening', 'Assessment', 'Interview', 'Offer', 'Hired']
const STAGE_COLOR: Record<string, string> = {
  Sourced: '#5b5585',
  Applied: '#383c5b',
  Screening: '#126f66',
  Assessment: '#4fd1a8',
  Interview: '#24af4f',
  Offer: '#208e2d',
  Hired: '#176b25',
}
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const ROLE_LABELS: Record<string, string> = {
  HR: 'HR',
  HM: 'Hiring Manager',
  RC: 'Recruiter',
  MD: 'Managing Director',
  SA: 'Administrator',
  SE: 'Sourcing',
  TJA: 'Talent Advisor',
}

const s = (v: unknown) => (v == null ? '' : String(v))
const daysBetween = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))

function roleLabel(roles: string[]): string {
  for (const key of ['MD', 'HR', 'HM', 'RC', 'SE', 'TJA', 'SA']) {
    if (roles.includes(key)) return ROLE_LABELS[key]
  }
  return roles[0] ? ROLE_LABELS[roles[0]] ?? roles[0] : 'Recruiter'
}

@Injectable()
export class LiveAnalyticsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private col(name: string) {
    const db = this.connection.db
    if (!db) throw new Error('MongoDB connection is not ready')
    return db.collection(name)
  }

  async overview(f: LiveFilters) {
    const [allDocs, usersRaw, talentProfiles, candidateProfiles] = await Promise.all([
      this.col('talent-pipeline-progress').find({}).toArray(),
      this.col('users').find({}, { projection: { firstname: 1, lastname: 1, role: 1, title: 1 } }).toArray(),
      this.col('talent-profile')
        .find({}, { projection: { userId: 1, 'user._id': 1, skills: 1, hardSkills: 1, softSkills: 1, domainSkills: 1 } })
        .toArray(),
      this.col('candidate-profile').find({}, { projection: { userId: 1, 'user._id': 1, skills: 1, hardSkills: 1 } }).toArray(),
    ])

    const userMap = new Map<string, { name: string; role: string }>()
    const supervisors: { id: string; name: string; role: string }[] = []
    for (const u of usersRaw as Record<string, any>[]) {
      const name = `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.title || 'Unknown'
      const roles: string[] = u.role ?? []
      userMap.set(s(u._id), { name, role: roleLabel(roles) })
      if (roles.some((r) => ['MD', 'HR', 'HM', 'SA'].includes(r))) {
        supervisors.push({ id: s(u._id), name, role: roleLabel(roles) })
      }
    }
    supervisors.sort((a, b) => a.name.localeCompare(b.name))

    const talentSkills = new Map<string, Set<string>>()
    const addSkills = (profiles: Record<string, any>[]) => {
      for (const p of profiles) {
        const key = s(p.userId ?? p.user?._id)
        if (!key) continue
        const set = talentSkills.get(key) ?? new Set<string>()
        for (const bucket of [p.skills, p.hardSkills, p.softSkills, p.domainSkills]) {
          for (const sk of bucket ?? []) if (sk?.skillName) set.add(String(sk.skillName))
        }
        talentSkills.set(key, set)
      }
    }
    addSkills(talentProfiles as Record<string, any>[])
    addSkills(candidateProfiles as Record<string, any>[])

    const recruiterIds = Array.from(new Set(allDocs.map((d: any) => s(d.createdBy)).filter(Boolean)))
    const recruiterOptions = recruiterIds
      .map((id) => ({ id, name: userMap.get(id)?.name ?? 'Unknown recruiter', role: userMap.get(id)?.role ?? 'Recruiter' }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const skillOptions = Array.from(
      new Set(allDocs.flatMap((d: any) => Array.from(talentSkills.get(s(d.talentId)) ?? []))),
    )
      .sort()
      .map((name) => ({ key: name, label: name }))

    const now = new Date()
    const months = RANGE_MONTHS[f.range] ?? 12
    const rangeStart =
      f.range === 'ytd' ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

    const scoped = allDocs.filter((d: any) => {
      const created = d.createdDate ? new Date(d.createdDate) : null
      if (created && created < rangeStart) return false
      if (f.recruiterId !== 'all' && s(d.createdBy) !== f.recruiterId) return false
      if (f.skill !== 'all') {
        const set = talentSkills.get(s(d.talentId))
        if (!set || !set.has(f.skill)) return false
      }
      return true
    })

    const appKey = (d: any) => `${s(d.talentId)}::${s(d.positionId)}`
    const apps = new Map<string, any[]>()
    for (const d of scoped) {
      const k = appKey(d)
      const arr = apps.get(k) ?? []
      arr.push(d)
      apps.set(k, arr)
    }

    const hiredKeys = new Set<string>()
    for (const [k, recs] of apps) {
      if (recs.some((r) => (r.finalDecision ?? '').toLowerCase() === 'passed')) hiredKeys.add(k)
    }
    const applicationCount = apps.size
    const hires = hiredKeys.size
    const conversion = applicationCount ? (hires / applicationCount) * 100 : 0

    const tthValues: number[] = []
    for (const [k, recs] of apps) {
      if (!hiredKeys.has(k)) continue
      const created = recs.map((r) => (r.createdDate ? new Date(r.createdDate) : null)).filter(Boolean) as Date[]
      const decided = recs.map((r) => (r.finalDecisionDate ? new Date(r.finalDecisionDate) : null)).filter(Boolean) as Date[]
      if (created.length && decided.length) {
        const start = new Date(Math.min(...created.map((d) => d.getTime())))
        const end = new Date(Math.max(...decided.map((d) => d.getTime())))
        tthValues.push(daysBetween(start, end))
      }
    }
    const avgTtH = tthValues.length ? Math.round(tthValues.reduce((a, b) => a + b, 0) / tthValues.length) : 0

    const scores = scoped.map((d: any) => d.assessmentScore).filter((n: any) => typeof n === 'number' && n > 0)
    const avgScore = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0

    const stageTalents = new Map<string, Set<string>>()
    for (const d of scoped) {
      const stage = d.stageName ?? 'Applied'
      const set = stageTalents.get(stage) ?? new Set<string>()
      set.add(s(d.talentId))
      stageTalents.set(stage, set)
    }
    const funnel = STAGE_ORDER.filter((st) => stageTalents.has(st)).map((st) => ({
      label: st,
      value: stageTalents.get(st)!.size,
      color: STAGE_COLOR[st] ?? '#24af4f',
    }))

    const trendBuckets: { label: string; key: string; applicants: Set<string>; hires: number }[] = []
    const count = Math.min(months, 12)
    for (let i = count - 1; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
      trendBuckets.push({ label: MONTH_LABELS[dt.getMonth()], key: `${dt.getFullYear()}-${dt.getMonth()}`, applicants: new Set(), hires: 0 })
    }
    const bucketByKey = new Map(trendBuckets.map((b) => [b.key, b]))
    for (const [k, recs] of apps) {
      const created = recs.map((r) => (r.createdDate ? new Date(r.createdDate) : null)).filter(Boolean) as Date[]
      if (!created.length) continue
      const first = new Date(Math.min(...created.map((d) => d.getTime())))
      const bk = bucketByKey.get(`${first.getFullYear()}-${first.getMonth()}`)
      if (bk) {
        bk.applicants.add(k)
        if (hiredKeys.has(k)) bk.hires += 1
      }
    }
    const trend = trendBuckets.map((b) => ({ label: b.label, applicants: b.applicants.size, hires: b.hires }))
    const tth = trendBuckets.map((b) => ({ label: b.label, days: avgTtH }))

    const recruiterAgg = new Map<string, { total: number; passed: number; scores: number[] }>()
    for (const [k, recs] of apps) {
      const rid = s(recs[0].createdBy)
      const agg = recruiterAgg.get(rid) ?? { total: 0, passed: 0, scores: [] }
      agg.total += 1
      if (hiredKeys.has(k)) agg.passed += 1
      for (const r of recs) if (typeof r.assessmentScore === 'number' && r.assessmentScore > 0) agg.scores.push(r.assessmentScore)
      recruiterAgg.set(rid, agg)
    }
    const recruiters = Array.from(recruiterAgg.entries())
      .map(([rid, agg]) => ({
        id: rid,
        name: userMap.get(rid)?.name ?? 'Unknown recruiter',
        role: userMap.get(rid)?.role ?? 'Recruiter',
        filled: agg.passed,
        timeToHire: avgTtH,
        assessment: agg.scores.length ? Math.round((agg.scores.reduce((a, b) => a + b, 0) / agg.scores.length) * 10) / 10 : 0,
        velocity: agg.total ? Math.round((agg.passed / agg.total) * 100) : 0,
      }))
      .sort((a, b) => b.filled - a.filled || b.velocity - a.velocity)
      .slice(0, 8)

    const recruiter = f.recruiterId === 'all' ? null : recruiterOptions.find((r) => r.id === f.recruiterId)
    const scopeLabel = recruiter
      ? `${recruiter.name} · ${recruiter.role}`
      : `Org-wide · ${recruiterOptions.length} recruiter${recruiterOptions.length === 1 ? '' : 's'}`

    return {
      ok: true,
      meta: {
        source: 'mongodb-nestjs',
        totalRecords: allDocs.length,
        scopedRecords: scoped.length,
        skillApplied: f.skill === 'all' || scoped.length > 0,
        generatedAt: new Date().toISOString(),
      },
      scopeLabel,
      kpis: {
        applications: { value: applicationCount.toLocaleString(), delta: `${scoped.length} events`, positive: true },
        conversion: { value: `${conversion.toFixed(1)}%`, delta: `${hires} hired`, positive: conversion > 0 },
        timeToHire: { value: avgTtH ? `${avgTtH}d` : '—', delta: `${tthValues.length} hires`, positive: true },
        quality: { value: avgScore ? avgScore.toFixed(1) : '—', delta: `${scores.length} scored`, positive: avgScore >= 6 },
      },
      trend,
      tth,
      funnel,
      recruiters,
      filterOptions: {
        recruiters: recruiterOptions,
        skills: [{ key: 'all', label: 'All skill sets' }, ...skillOptions],
        viewers: supervisors.length ? supervisors : recruiterOptions.slice(0, 1),
      },
    }
  }
}
