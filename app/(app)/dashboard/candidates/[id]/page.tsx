import { notFound } from "next/navigation"
import Link from "next/link"
import {
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CalendarPlus,
  FileSignature,
  TrendingUp,
} from "lucide-react"
import { Topbar } from "@/components/app/topbar"
import { SectionCard } from "@/components/app/widgets"
import { FitRadar } from "@/components/app/charts"
import { WorkStylePanel } from "@/components/app/work-style"
import { Avatar, Badge, Progress, Button } from "@/components/ui/primitives"
import { getCandidate, getJob, CANDIDATES } from "@/lib/data"
import { pipelineStageById } from "@/lib/journey"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return CANDIDATES.map((c) => ({ id: c.id }))
}

export default async function CandidateProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = getCandidate(id)
  if (!c) notFound()
  const job = getJob(c.jobId)
  const stage = pipelineStageById(c.status)

  const radar = c.elements.map((e) => ({ axis: e.name.split(" ")[0], value: e.score }))
  const evidenceColor: Record<string, string> = {
    strong: "#176b25",
    moderate: "#4fd1a8",
    "needs-validation": "#d1a18f",
  }

  return (
    <>
      <Topbar title="Talemistry Profile" subtitle={`Chemistry intelligence for ${c.name}`} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-5 md:p-7">
        <Link
          href="/dashboard/candidates"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to talent pool
        </Link>

        {/* Header */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <Avatar name={c.name} size={72} className="text-lg" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl font-semibold text-foreground">{c.name}</h2>
                {stage ? (
                  <Badge style={{ backgroundColor: `${stage.color}1a`, color: stage.color }}>{stage.name}</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-muted-foreground">{c.title}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{c.location}</span>
                <span className="inline-flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{c.experienceYears} yrs exp</span>
                <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{c.email}</span>
                <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" />{c.phone}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href="/dashboard/interviews"><CalendarPlus className="h-4 w-4" />Schedule interview</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/offers"><FileSignature className="h-4 w-4" />Prepare offer</Link>
                </Button>
                <Button variant="ghost" size="sm">Move stage</Button>
              </div>
            </div>

            {/* Chemistry Match dial */}
            <div className="flex shrink-0 flex-col items-center rounded-2xl bg-primary/8 p-5 text-center">
              <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Chemistry Match
              </span>
              <span className="mt-1 font-serif text-5xl font-bold text-primary">{c.matchScore}</span>
              <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                {(["role", "team", "org"] as const).map((k) => (
                  <div key={k}>
                    <p className="font-serif text-base font-semibold text-foreground">{c.chemistry[k]}</p>
                    <p className="capitalize text-muted-foreground">{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI summary */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">Talemistry insight</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{c.summary}</p>
        </div>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Candidate Formula radar */}
          <SectionCard title="Candidate Formula" className="lg:col-span-1">
            <FitRadar data={radar} />
            <div className="mt-2 space-y-2">
              {c.elements.map((e) => (
                <div key={e.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{e.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{e.score}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                      style={{ backgroundColor: `${evidenceColor[e.evidence]}1a`, color: evidenceColor[e.evidence] }}
                    >
                      {e.evidence.replace("-", " ")}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Verified skills" className="lg:col-span-1">
            <div className="space-y-3">
              {c.skills.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      {s.verified ? <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> : null}
                      {s.name}
                      {s.category === "nice-to-have" ? (
                        <span className="text-[10px] text-muted-foreground">(bonus)</span>
                      ) : null}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">{s.level}</span>
                  </div>
                  <Progress value={s.level} className={cn(!s.verified && "opacity-60")} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Work style */}
          <SectionCard title="Team Chemistry" className="lg:col-span-1">
            <WorkStylePanel ws={c.workStyle} />
          </SectionCard>
        </section>

        {/* Potential spectrum */}
        <SectionCard title="Potential Spectrum">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: "Demonstrated strengths", items: c.potentialSpectrum.strengths, tone: "#176b25", icon: TrendingUp },
              { label: "Transferable potential", items: c.potentialSpectrum.transferable, tone: "#4fd1a8", icon: Sparkles },
              { label: "Development areas", items: c.potentialSpectrum.development, tone: "#d1a18f", icon: AlertTriangle },
            ].map((group) => {
              const Icon = group.icon
              return (
                <div key={group.label} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center gap-2" style={{ color: group.tone }}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{group.label}</span>
                  </div>
                  <ul className="space-y-2">
                    {group.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: group.tone }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* Red flags + role context */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {c.redFlags.length > 0 ? (
            <SectionCard title="Areas to validate" className="lg:col-span-2">
              <ul className="space-y-2">
                {c.redFlags.map((f) => (
                  <li key={f} className="flex items-start gap-2 rounded-lg bg-[#d1a18f]/10 p-3 text-sm text-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#a15a3f]" />
                    {f}
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : (
            <SectionCard title="Areas to validate" className="lg:col-span-2">
              <p className="rounded-lg bg-secondary/8 p-3 text-sm text-foreground">
                No risk signals detected. All core requirements show supporting evidence.
              </p>
            </SectionCard>
          )}
          <SectionCard title="Applied for">
            {job ? (
              <Link href={`/dashboard/jobs/${job.id}`} className="block rounded-lg border border-border p-3 transition hover:border-ring">
                <p className="text-sm font-semibold text-foreground">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.department} · {job.location}</p>
                <p className="mt-2 text-xs text-muted-foreground">Source: {c.source}</p>
              </Link>
            ) : null}
          </SectionCard>
        </section>
      </main>
    </>
  )
}
