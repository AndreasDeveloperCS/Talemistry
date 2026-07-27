import { Topbar } from "@/components/app/topbar"
import { SectionCard, StatCard } from "@/components/app/widgets"
import { TrendArea, SourceDonut, TimeToHireLine, FunnelBars } from "@/components/app/charts"
import { Card, Badge, Progress } from "@/components/ui/primitives"
import { Users, Target, Clock, Award } from "lucide-react"
import {
  HIRING_TREND,
  FUNNEL,
  SOURCE_EFFECTIVENESS,
  RECRUITER_PERFORMANCE,
  TEAM_HIERARCHY,
} from "@/lib/data"

const SOURCE_COLORS = ["#208e2d", "#4fd1a8", "#5b5585", "#24af4f", "#d1a18f", "#545454"]

export default function AnalyticsPage() {
  const trend = HIRING_TREND.map((h) => ({
    label: h.month,
    hires: h.hires,
    applicants: Math.round(h.applications / 10),
  }))
  const tth = HIRING_TREND.map((h) => ({ label: h.month, days: h.timeToHire }))
  const sources = SOURCE_EFFECTIVENESS.map((s, i) => ({
    label: s.source,
    value: s.hires,
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }))
  const funnel = FUNNEL.map((f) => ({ label: f.stage, value: f.value, color: f.color }))

  return (
    <>
      <Topbar title="Recruitment Analytics" subtitle="Pipeline health, velocity and team performance" />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-5 md:p-7">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total applications" value="1,598" delta="+22%" icon={Users} />
          <StatCard label="Conversion to hire" value="2.1%" delta="+0.4%" icon={Target} />
          <StatCard label="Avg. time to hire" value="27d" delta="13%" positive icon={Clock} />
          <StatCard label="Quality of hire" value="8.4" delta="+0.6" icon={Award} hint="90-day manager rating" />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <SectionCard title="Applications vs. hires" className="lg:col-span-3">
            <TrendArea data={trend} />
          </SectionCard>
          <SectionCard title="Time to hire trend" className="lg:col-span-2">
            <TimeToHireLine data={tth} />
          </SectionCard>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <SectionCard title="Conversion funnel" className="lg:col-span-3">
            <FunnelBars data={funnel} />
          </SectionCard>
          <SectionCard title="Hires by source" className="lg:col-span-2">
            <SourceDonut data={sources} />
            <ul className="mt-4 space-y-2">
              {sources.map((s) => (
                <li key={s.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-medium text-foreground">{s.value} hires</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard title="Recruiter performance">
            <div className="space-y-4">
              {RECRUITER_PERFORMANCE.map((r) => (
                <div key={r.name} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{r.name}</span>
                    <Badge className="bg-secondary/12 text-secondary">{r.filled} filled</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="font-serif text-lg font-semibold text-foreground">{r.timeToHire}d</p>
                      <p className="text-xs text-muted-foreground">Time to hire</p>
                    </div>
                    <div>
                      <p className="font-serif text-lg font-semibold text-foreground">{r.nps}</p>
                      <p className="text-xs text-muted-foreground">Candidate NPS</p>
                    </div>
                    <div>
                      <p className="font-serif text-lg font-semibold text-foreground">{r.velocity}%</p>
                      <p className="text-xs text-muted-foreground">Velocity</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Source quality index">
            <div className="space-y-4">
              {SOURCE_EFFECTIVENESS.map((s) => (
                <div key={s.source}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{s.source}</span>
                    <span className="font-medium text-muted-foreground">{s.quality}/100</span>
                  </div>
                  <Progress value={s.quality} />
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <SectionCard title="Team hierarchy & load">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">{TEAM_HIERARCHY.director.name}</p>
            <p className="text-xs text-muted-foreground">{TEAM_HIERARCHY.director.role}</p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {TEAM_HIERARCHY.managers.map((m) => (
              <Card key={m.name} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg font-semibold text-foreground">{m.filledQtr}</p>
                    <p className="text-xs text-muted-foreground">filled / qtr</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-accent/12 text-accent">{m.openReqs} open reqs</Badge>
                  <span className="text-xs text-muted-foreground">Team: {m.team.join(", ")}</span>
                </div>
              </Card>
            ))}
          </div>
        </SectionCard>
      </main>
    </>
  )
}
