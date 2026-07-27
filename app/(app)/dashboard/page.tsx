import Link from "next/link"
import { Briefcase, Users, Clock, TrendingUp, ArrowRight, Plug } from "lucide-react"
import { Topbar } from "@/components/app/topbar"
import { StatCard, ActivityFeed, SectionCard, CandidateRow } from "@/components/app/widgets"
import { TrendArea, FunnelBars } from "@/components/app/charts"
import { Card, Badge } from "@/components/ui/primitives"
import {
  CANDIDATES,
  FUNNEL,
  HIRING_TREND,
  ACTIVITY,
  EXTERNAL_DASHBOARDS,
  JOBS,
} from "@/lib/data"
import { pipelineStageById } from "@/lib/journey"

export default function DashboardPage() {
  const trend = HIRING_TREND.map((h) => ({
    label: h.month,
    hires: h.hires,
    applicants: Math.round(h.applications / 10),
  }))
  const funnel = FUNNEL.map((f) => ({ label: f.stage, value: f.value, color: f.color }))
  const topCandidates = [...CANDIDATES].sort((a, b) => b.matchScore - a.matchScore).slice(0, 5)
  const openRoles = JOBS.filter((j) => j.status === "published").length

  const statusTone: Record<string, string> = {
    connected: "#24af4f",
    syncing: "#4fd1a8",
    "action-needed": "#ae0301",
  }

  return (
    <>
      <Topbar title="Talent Command Center" subtitle="Wednesday, July 27 — 9 open roles across 3 teams" />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-5 md:p-7">
        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open roles" value={String(openRoles)} delta="+2" icon={Briefcase} hint="3 awaiting approval" />
          <StatCard label="Active candidates" value={String(CANDIDATES.length * 47)} delta="+18%" icon={Users} hint="Across all pipelines" />
          <StatCard label="Avg. time to hire" value="27d" delta="8%" positive icon={Clock} hint="Down from 31d last quarter" />
          <StatCard label="Offer acceptance" value="86%" delta="+4%" icon={TrendingUp} hint="Rolling 90 days" />
        </section>

        {/* Trend + funnel */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <SectionCard title="Hiring momentum" action="View analytics" href="/dashboard/analytics" className="lg:col-span-3">
            <TrendArea data={trend} />
          </SectionCard>
          <SectionCard title="Journey funnel" action="Open pipeline" href="/dashboard/pipeline" className="lg:col-span-2">
            <FunnelBars data={funnel} />
          </SectionCard>
        </section>

        {/* Top candidates + activity */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <SectionCard title="Top matches this week" action="All candidates" href="/dashboard/candidates" className="lg:col-span-3">
            <div className="space-y-0.5">
              {topCandidates.map((c) => {
                const stage = pipelineStageById(c.status)
                return (
                  <CandidateRow
                    key={c.id}
                    id={c.id}
                    name={c.name}
                    role={c.title}
                    score={c.matchScore}
                    status={stage?.name ?? c.status}
                    statusColor={stage?.color ?? "#545454"}
                  />
                )
              })}
            </div>
          </SectionCard>
          <SectionCard title="Live activity" className="lg:col-span-2">
            <ActivityFeed items={ACTIVITY} />
          </SectionCard>
        </section>

        {/* External dashboards */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-primary" />
              <h2 className="font-serif text-base font-semibold text-foreground">Connected dashboards</h2>
            </div>
            <Link href="/dashboard/integrations" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Manage integrations <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXTERNAL_DASHBOARDS.map((d) => (
              <Card key={d.name} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{d.name}</span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: statusTone[d.status] }}
                    aria-label={d.status}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{d.category}</p>
                <p className="mt-3 font-serif text-sm font-semibold text-foreground">{d.metric}</p>
                <Badge
                  className="mt-2"
                  style={{ backgroundColor: `${statusTone[d.status]}1a`, color: statusTone[d.status] }}
                >
                  {d.status}
                </Badge>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
