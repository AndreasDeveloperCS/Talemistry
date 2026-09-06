import type { Metadata } from "next"
import { Topbar } from "@/components/app/topbar"
import { Card, Badge, Button, Progress } from "@/components/ui/primitives"
import { JOBS } from "@/lib/data"
import { getJobs } from "@/lib/repos"
import { formatCurrency } from "@/lib/utils"
import { JOURNEY_STAGES } from "@/lib/journey"
import { MapPin, Users, Briefcase, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Jobs & Roles",
  description: "Discover & Attract — craft roles, publish across channels and attract aligned talent.",
}

export const dynamic = "force-dynamic"

const STATUS_TONE = {
  draft: "neutral",
  "pending-approval": "amber",
  published: "green",
  closed: "red",
} as const

const PRIORITY_TONE = { high: "red", medium: "amber", low: "neutral" } as const

export default async function JobsPage() {
  const live = await getJobs().catch(() => [])
  const JOBS_DATA = live.length > 0 ? live : JOBS
  const published = JOBS_DATA.filter((j) => j.status === "published").length
  const applicants = JOBS_DATA.reduce((s, j) => s + j.applicants, 0)

  return (
    <>
      <Topbar
        title="Jobs & Roles"
        subtitle="Discover & Attract — turn intent into aligned, well-crafted roles."
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Published roles</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{published}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Total applicants</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{applicants.toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Avg JD quality</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {Math.round(JOBS_DATA.reduce((s, j) => s + j.jdQuality, 0) / JOBS_DATA.length)}
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          {JOBS_DATA.map((j) => {
            const stage = JOURNEY_STAGES.find((s) => s.id === j.stage)
            return (
              <Card key={j.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-balance">{j.title}</h3>
                      <Badge tone={STATUS_TONE[j.status]}>{j.status.replace("-", " ")}</Badge>
                      <Badge tone={PRIORITY_TONE[j.priority]}>{j.priority} priority</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-4 w-4" aria-hidden />
                        {j.department}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" aria-hidden />
                        {j.location} · {j.type}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-4 w-4" aria-hidden />
                        {j.openings} opening{j.openings > 1 ? "s" : ""}
                      </span>
                      <span>{formatCurrency(j.salaryBand[0])} – {formatCurrency(j.salaryBand[1])}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {j.skills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:w-64">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/60 p-3 text-center">
                        <p className="text-xl font-semibold">{j.applicants}</p>
                        <p className="text-xs text-muted-foreground">Applicants</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-3 text-center">
                        <p className="text-xl font-semibold">{j.inPipeline}</p>
                        <p className="text-xs text-muted-foreground">In pipeline</p>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden /> JD quality
                        </span>
                        <span className="font-medium">{j.jdQuality}</span>
                      </div>
                      <Progress value={j.jdQuality} />
                    </div>
                    {stage && (
                      <span
                        className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${stage.color}1a`, color: stage.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                        {stage.name} stage
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                  <span className="text-muted-foreground">
                    Hiring manager <span className="text-foreground">{j.hiringManager}</span> · Recruiter{" "}
                    <span className="text-foreground">{j.recruiter}</span>
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Channels
                    </Button>
                    <Button variant="outline" size="sm">
                      View pipeline
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </main>
    </>
  )
}
