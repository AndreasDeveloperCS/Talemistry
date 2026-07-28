"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Calendar, ChevronDown, Database, Layers, RotateCcw, Users2, UserRound, WifiOff } from "lucide-react"
import { SectionCard, StatCard } from "@/components/app/widgets"
import { TrendArea, TimeToHireLine, FunnelBars } from "@/components/app/charts"
import { Card, Badge, Progress } from "@/components/ui/primitives"
import { Users, Target, Clock, Award } from "lucide-react"
import { computeAnalytics, DEFAULT_FILTERS, TIME_RANGES, type AnalyticsFilters } from "@/lib/analytics"
import type { LiveAnalytics } from "@/lib/analytics-live"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string
  label: string
  icon: React.ElementType
  value: string
  onChange: (v: string) => void
  disabled?: boolean
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
          disabled={disabled}
          className="h-9 w-full min-w-0 appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm font-medium text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
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

interface Filters {
  range: string
  viewerId: string
  recruiterId: string
  skill: string
}

const DEFAULTS: Filters = { range: "12m", viewerId: "all", recruiterId: "all", skill: "all" }

export function AnalyticsView() {
  const [filters, setFilters] = useState<Filters>(DEFAULTS)

  const query = new URLSearchParams(filters).toString()
  const { data, isLoading } = useSWR<LiveAnalytics & { ok: boolean; error?: string }>(
    `/api/analytics?${query}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false },
  )

  const live = data?.ok ? data : null

  // Fallback to the internal sample model when the database is unreachable.
  const fallback = useMemo(() => computeAnalytics(DEFAULT_FILTERS as AnalyticsFilters), [])
  const usingLive = Boolean(live)

  const recruiterOptions = live?.filterOptions.recruiters ?? []
  const skillOptions = live?.filterOptions.skills ?? [{ key: "all", label: "All skill sets" }]
  const viewerOptions = live?.filterOptions.viewers ?? []

  const kpis = live?.kpis ?? fallback.kpis
  const trend = live?.trend ?? fallback.trend
  const tth = live?.tth ?? fallback.tth
  const funnel = live?.funnel ?? fallback.funnel
  const recruiters = live?.recruiters ?? []
  const scopeLabel = live?.scopeLabel ?? fallback.scopeLabel

  const isDefault =
    filters.range === DEFAULTS.range &&
    filters.viewerId === DEFAULTS.viewerId &&
    filters.recruiterId === DEFAULTS.recruiterId &&
    filters.skill === DEFAULTS.skill

  function update(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  const rangeLabel = TIME_RANGES.find((r) => r.key === filters.range)?.label
  const viewer = viewerOptions.find((v) => v.id === filters.viewerId)
  const skillLabel = skillOptions.find((s) => s.key === filters.skill)?.label
  const recruiterLabel = recruiterOptions.find((r) => r.id === filters.recruiterId)?.name

  const chips = [
    rangeLabel,
    filters.viewerId !== "all" && viewer ? `Viewing as ${viewer.name}` : "Org-wide report",
    filters.recruiterId !== "all" && recruiterLabel ? recruiterLabel : "All recruiters",
    filters.skill !== "all" ? skillLabel : undefined,
  ].filter((c): c is string => Boolean(c))

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-5 md:p-7">
      {/* Data source status */}
      <div className="flex flex-wrap items-center gap-2">
        {usingLive ? (
          <Badge className="gap-1.5 bg-primary/10 text-primary">
            <Database className="h-3.5 w-3.5" aria-hidden />
            Live · MongoDB
          </Badge>
        ) : (
          <Badge className="gap-1.5 bg-destructive/10 text-destructive">
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            {isLoading ? "Connecting…" : "Sample data (database offline)"}
          </Badge>
        )}
        {live ? (
          <span className="text-xs text-muted-foreground">
            {live.meta.scopedRecords} of {live.meta.totalRecords} pipeline records
            {live.meta.skillApplied ? "" : " · skill filter not applicable"}
          </span>
        ) : null}
      </div>

      {/* Filter bar */}
      <Card className="p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field id="f-range" label="Time range" icon={Calendar} value={filters.range} onChange={(v) => update({ range: v })}>
            {TIME_RANGES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Field>

          <Field
            id="f-viewer"
            label="Reporting to (supervisor)"
            icon={Users2}
            value={filters.viewerId}
            onChange={(v) => update({ viewerId: v })}
            disabled={!usingLive}
          >
            <option value="all">All supervisors (org-wide)</option>
            {viewerOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role}
              </option>
            ))}
          </Field>

          <Field
            id="f-recruiter"
            label="Recruiter"
            icon={UserRound}
            value={filters.recruiterId}
            onChange={(v) => update({ recruiterId: v })}
            disabled={!usingLive}
          >
            <option value="all">All recruiters</option>
            {recruiterOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role}
              </option>
            ))}
          </Field>

          <Field
            id="f-skill"
            label="Skill set"
            icon={Layers}
            value={filters.skill}
            onChange={(v) => update({ skill: v })}
            disabled={!usingLive}
          >
            {skillOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Active view:</span>
          {chips.map((c) => (
            <Badge key={c} className="bg-primary/10 text-primary">
              {c}
            </Badge>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{scopeLabel}</span>
          {!isDefault ? (
            <button
              type="button"
              onClick={() => setFilters(DEFAULTS)}
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
        <StatCard label="Applications" value={kpis.applications.value} delta={kpis.applications.delta} positive={kpis.applications.positive} icon={Users} hint="candidate · position pairs" />
        <StatCard label="Conversion to hire" value={kpis.conversion.value} delta={kpis.conversion.delta} positive={kpis.conversion.positive} icon={Target} />
        <StatCard label="Avg. time to hire" value={kpis.timeToHire.value} delta={kpis.timeToHire.delta} positive={kpis.timeToHire.positive} icon={Clock} hint="sourced → decision" />
        <StatCard label="Avg. assessment score" value={kpis.quality.value} delta={kpis.quality.delta} positive={kpis.quality.positive} icon={Award} hint="out of 10" />
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
        <SectionCard title="Pipeline funnel by stage" className="lg:col-span-3">
          {funnel.length ? (
            <FunnelBars data={funnel} />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No pipeline records match the current filters.</p>
          )}
        </SectionCard>
        <SectionCard title="Recruiter performance" className="lg:col-span-2">
          {recruiters.length ? (
            <div className="space-y-3">
              {recruiters.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.role}</p>
                    </div>
                    <Badge className="shrink-0 bg-secondary/12 text-secondary">{r.filled} hired</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-serif text-base font-semibold text-foreground">{r.timeToHire}d</p>
                      <p className="text-[11px] text-muted-foreground">Time to hire</p>
                    </div>
                    <div>
                      <p className="font-serif text-base font-semibold text-foreground">{r.assessment || "—"}</p>
                      <p className="text-[11px] text-muted-foreground">Avg score</p>
                    </div>
                    <div>
                      <p className="font-serif text-base font-semibold text-foreground">{r.velocity}%</p>
                      <p className="text-[11px] text-muted-foreground">Pass rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {usingLive ? "No recruiter activity in this scope." : "Recruiter breakdown requires a live database connection."}
            </p>
          )}
        </SectionCard>
      </section>
    </main>
  )
}
