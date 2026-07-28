"use client"

import { useMemo, useState } from "react"
import { Calendar, ChevronDown, Layers, RotateCcw, Users2, UserRound } from "lucide-react"
import { SectionCard, StatCard } from "@/components/app/widgets"
import { TrendArea, SourceDonut, TimeToHireLine, FunnelBars } from "@/components/app/charts"
import { Card, Badge, Progress } from "@/components/ui/primitives"
import { Users, Target, Clock, Award } from "lucide-react"
import {
  computeAnalytics,
  carriersForViewer,
  DEFAULT_FILTERS,
  PEOPLE,
  SKILL_SETS,
  TIME_RANGES,
  VIEWERS,
  type AnalyticsFilters,
} from "@/lib/analytics"

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  icon: React.ElementType
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full min-w-0 appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  )
}

export function AnalyticsView() {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS)

  const recruiterOptions = useMemo(() => carriersForViewer(filters.viewerId), [filters.viewerId])

  const data = useMemo(() => computeAnalytics(filters), [filters])

  const isDefault =
    filters.range === DEFAULT_FILTERS.range &&
    filters.viewerId === DEFAULT_FILTERS.viewerId &&
    filters.recruiterId === DEFAULT_FILTERS.recruiterId &&
    filters.skill === DEFAULT_FILTERS.skill

  function update(patch: Partial<AnalyticsFilters>) {
    setFilters((prev) => {
      const next = { ...prev, ...patch }
      // If the viewer changes, make sure the selected recruiter is still in scope.
      if (patch.viewerId) {
        const stillValid = carriersForViewer(patch.viewerId).some((p) => p.id === next.recruiterId)
        if (!stillValid) next.recruiterId = "all"
      }
      return next
    })
  }

  const viewer = PEOPLE.find((p) => p.id === filters.viewerId)
  const rangeLabel = TIME_RANGES.find((r) => r.key === filters.range)?.label
  const skillLabel = SKILL_SETS.find((s) => s.key === filters.skill)?.label

  const chips = [
    { label: rangeLabel },
    { label: viewer ? `Reports to ${viewer.name}` : undefined },
    filters.recruiterId !== "all"
      ? { label: recruiterOptions.find((p) => p.id === filters.recruiterId)?.name }
      : { label: "All recruiters" },
    filters.skill !== "all" ? { label: skillLabel } : undefined,
  ].filter((c): c is { label: string } => Boolean(c && c.label))

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-5 md:p-7">
      {/* Filter bar */}
      <Card className="p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field id="f-range" label="Time range" icon={Calendar} value={filters.range} onChange={(v) => update({ range: v as AnalyticsFilters["range"] })}>
            {TIME_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Field>

          <Field id="f-viewer" label="Reporting to (supervisor)" icon={Users2} value={filters.viewerId} onChange={(v) => update({ viewerId: v })}>
            {VIEWERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role}
              </option>
            ))}
          </Field>

          <Field id="f-recruiter" label="Recruiter" icon={UserRound} value={filters.recruiterId} onChange={(v) => update({ recruiterId: v })}>
            <option value="all">All recruiters in team</option>
            {recruiterOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role}
              </option>
            ))}
          </Field>

          <Field id="f-skill" label="Skill set" icon={Layers} value={filters.skill} onChange={(v) => update({ skill: v })}>
            {SKILL_SETS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Active view:</span>
          {chips.map((c) => (
            <Badge key={c.label} className="bg-primary/10 text-primary">
              {c.label}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{data.scopeLabel}</span>
          {!isDefault ? (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          ) : null}
        </div>
      </Card>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={data.kpis.applications.value} delta={data.kpis.applications.delta} positive={data.kpis.applications.positive} icon={Users} />
        <StatCard label="Conversion to hire" value={data.kpis.conversion.value} delta={data.kpis.conversion.delta} positive={data.kpis.conversion.positive} icon={Target} />
        <StatCard label="Avg. time to hire" value={data.kpis.timeToHire.value} delta={data.kpis.timeToHire.delta} positive={data.kpis.timeToHire.positive} icon={Clock} hint="vs. previous period" />
        <StatCard label="Quality of hire" value={data.kpis.quality.value} delta={data.kpis.quality.delta} positive={data.kpis.quality.positive} icon={Award} hint="90-day manager rating" />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCard title="Applications vs. hires" className="lg:col-span-3">
          <TrendArea data={data.trend} />
        </SectionCard>
        <SectionCard title="Time to hire trend" className="lg:col-span-2">
          <TimeToHireLine data={data.tth} />
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <SectionCard title="Conversion funnel" className="lg:col-span-3">
          <FunnelBars data={data.funnel} />
        </SectionCard>
        <SectionCard title="Hires by source" className="lg:col-span-2">
          <SourceDonut data={data.sources} />
          <ul className="mt-4 space-y-2">
            {data.sources.map((s) => (
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
          {data.recruiters.length ? (
            <div className="space-y-4">
              {data.recruiters.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-foreground">{r.name}</span>
                      <p className="text-xs text-muted-foreground">{r.role}</p>
                    </div>
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
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No recruiters match the current filters.</p>
          )}
        </SectionCard>

        <SectionCard title="Source quality index">
          <div className="space-y-4">
            {data.sourceQuality.map((s) => (
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
    </main>
  )
}
