import type { Job } from "@/lib/data"

/**
 * Translates a legacy `backend/` OpenPosition document
 * (backend/src/app/modules/positions/models/open-position.ts) into the
 * new Talemistry `Job` shape (lib/data.ts). Legacy has no analog for
 * openings/applicants/inPipeline/channels (those depend on the Pipeline
 * domain, not yet wired — see plan roadmap) or jdQuality, so those default.
 */

// Legacy PositionStatus (backend/.../models/position-item.ts) has no 1:1
// mapping to the new Job.status vocabulary — this is a product approximation.
const STATUS_MAP: Record<string, Job["status"]> = {
  draft: "draft",
  active: "published",
  paused: "pending-approval",
  closed: "closed",
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback
  if (typeof v === "string") return v
  if (typeof v === "object" && "toString" in v) return String(v)
  return fallback
}

export function mapPositionToJob(position: Record<string, any>): Job {
  const details = position.positionDetails ?? {}
  const requirements = details.requirements ?? {}
  const conditions = details.conditions ?? {}
  const company = details.company?.data ?? {}
  const country = Array.isArray(details.headquarterLocation) ? details.headquarterLocation[0] : undefined
  const manager = details.mainHiringManager ?? {}
  const skills: string[] = Array.isArray(requirements.positionSkills)
    ? requirements.positionSkills.map((s: any) => str(s?.skillName)).filter(Boolean)
    : []
  const maxBudget = Number(conditions.budget?.maxBudgetAmount) || 0

  return {
    id: str(position._id),
    title: str(position.title),
    department: str(company.companyName, "—"),
    location: str(country?.name, "—"),
    type: str(conditions.jobType, "Full Time"),
    status: STATUS_MAP[str(position.status)] ?? "draft",
    stage: "attract",
    openings: 0, // TODO(phase4): needs Pipeline domain
    applicants: 0, // TODO(phase4): needs Pipeline domain
    inPipeline: 0, // TODO(phase4): needs Pipeline domain
    jdQuality: 0, // TODO(phase4): no legacy analog
    salaryBand: [0, maxBudget],
    postedAt: str(position.createdDate, new Date().toISOString()),
    hiringManager: [str(manager.firstname), str(manager.lastname)].filter(Boolean).join(" ") || "—",
    recruiter: "—", // TODO(phase4): needs auth-translated user lookup
    priority: "medium",
    channels: [], // TODO(phase4): no legacy analog
    skills,
  }
}
