"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Sparkles, MapPin, ShieldCheck, LayoutGrid, Rows3 } from "lucide-react"
import { Avatar, Badge } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"
import { PIPELINE_STAGES, pipelineStageById } from "@/lib/journey"
import type { Candidate } from "@/lib/data"

type ViewMode = "pile" | "list"

export function CandidateExplorer({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<string>("all")
  const [minScore, setMinScore] = useState(0)
  const [view, setView] = useState<ViewMode>("pile")

  const filtered = useMemo(() => {
    return candidates
      .filter((c) => (stage === "all" ? true : c.status === stage))
      .filter((c) => c.matchScore >= minScore)
      .filter((c) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.skills.some((s) => s.name.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.matchScore - a.matchScore)
  }, [candidates, query, stage, minScore])

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role or skill..."
            aria-label="Search candidates"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStage("all")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              stage === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            All stages
          </button>
          {PIPELINE_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStage(s.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                stage === s.id ? "text-white" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
              style={stage === s.id ? { backgroundColor: s.color } : undefined}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 px-1">
        <label className="text-xs font-medium text-muted-foreground">Min match</label>
        <input
          type="range"
          min={0}
          max={100}
          value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="h-1.5 w-40 accent-[var(--color-primary)]"
          aria-label="Minimum match score"
        />
        <span className="text-xs font-semibold text-foreground">{minScore}+</span>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} candidates</span>

        {/* View toggle: Pile (card grid) vs List (compact rows) */}
        <div
          role="radiogroup"
          aria-label="View mode"
          className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={view === "pile"}
            onClick={() => setView("pile")}
            title="Pile view"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
              view === "pile"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pile</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={view === "list"}
            onClick={() => setView("list")}
            title="List view"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Rows3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>
      </div>

      {/* Pile view — card grid */}
      {view === "pile" && (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const sm = pipelineStageById(c.status)
          const verified = c.skills.filter((s) => s.verified).length
          return (
            <Link
              key={c.id}
              href={`/dashboard/candidates/${c.id}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-4 transition hover:border-ring hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {c.location}
                  </p>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-primary/8 px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-0.5 font-serif text-base font-bold text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {c.matchScore}
                  </span>
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">match</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.skills.slice(0, 3).map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground"
                  >
                    {s.verified ? <ShieldCheck className="h-3 w-3 text-secondary" /> : null}
                    {s.name}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                {sm ? (
                  <Badge style={{ backgroundColor: `${sm.color}1a`, color: sm.color }}>{sm.name}</Badge>
                ) : null}
                <span className="text-xs text-muted-foreground">{verified} verified skills</span>
              </div>
            </Link>
          )
        })}
      </div>
      )}

      {/* List view — compact rows */}
      {view === "list" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden items-center gap-4 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:flex">
            <span className="flex-1">Candidate</span>
            <span className="hidden w-40 lg:block">Location</span>
            <span className="hidden w-64 xl:block">Top skills</span>
            <span className="w-28">Stage</span>
            <span className="w-24 text-right">Verified</span>
            <span className="w-16 text-right">Match</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((c) => {
              const sm = pipelineStageById(c.status)
              const verified = c.skills.filter((s) => s.verified).length
              return (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/candidates/${c.id}`}
                    className="group flex items-center gap-4 px-4 py-3 transition hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={c.name} size={38} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                      </div>
                    </div>

                    <span className="hidden w-40 items-center gap-1 truncate text-xs text-muted-foreground lg:inline-flex">
                      <MapPin className="h-3 w-3 shrink-0" /> {c.location}
                    </span>

                    <div className="hidden w-64 flex-wrap gap-1.5 xl:flex">
                      {c.skills.slice(0, 3).map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground"
                        >
                          {s.verified ? <ShieldCheck className="h-3 w-3 text-secondary" /> : null}
                          {s.name}
                        </span>
                      ))}
                    </div>

                    <span className="w-28">
                      {sm ? (
                        <Badge style={{ backgroundColor: `${sm.color}1a`, color: sm.color }}>{sm.name}</Badge>
                      ) : null}
                    </span>

                    <span className="w-24 text-right text-xs text-muted-foreground">{verified} verified</span>

                    <span className="inline-flex w-16 items-center justify-end gap-0.5 font-serif text-sm font-bold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      {c.matchScore}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
