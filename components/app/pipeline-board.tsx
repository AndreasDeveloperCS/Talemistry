"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { GripVertical, MapPin, Sparkles } from "lucide-react"
import { Avatar } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"
import { PIPELINE_STAGES, type PipelineStatus } from "@/lib/journey"
import type { Candidate } from "@/lib/data"

export function PipelineBoard({ initial }: { initial: Candidate[] }) {
  const [candidates, setCandidates] = useState(initial)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<PipelineStatus | null>(null)

  const byStage = useMemo(() => {
    const map: Record<string, Candidate[]> = {}
    for (const s of PIPELINE_STAGES) map[s.id] = []
    for (const c of candidates) {
      if (map[c.status]) map[c.status].push(c)
    }
    return map
  }, [candidates])

  function onDrop(stage: PipelineStatus) {
    if (!dragId) return
    const id = dragId
    const previous = candidates
    const moved = candidates.find((c) => c.id === id)
    setDragId(null)
    setOverStage(null)
    if (!moved || moved.status === stage) return

    // Optimistic update, then persist to MongoDB (rollback on failure).
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: stage } : c)))
    fetch(`/api/candidates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: stage }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
      })
      .catch(() => setCandidates(previous))
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const list = byStage[stage.id] ?? []
        return (
          <section
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault()
              setOverStage(stage.id)
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
            onDrop={() => onDrop(stage.id)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors",
              overStage === stage.id ? "border-ring bg-primary/5" : "border-border",
            )}
          >
            <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-semibold text-foreground">{stage.name}</span>
              </div>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {list.length}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-2 p-2">
              {list.map((c) => (
                <article
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "group cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition active:cursor-grabbing",
                    dragId === c.id && "opacity-50",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={c.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/candidates/${c.id}`}
                        className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {c.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{c.title}</p>
                    </div>
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 transition group-hover:opacity-100" />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {c.location.split(",")[0]}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: c.matchScore >= 85 ? "#24af4f1a" : "#5457540f",
                        color: c.matchScore >= 85 ? "#176b25" : "#545454",
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                      {c.matchScore}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.tags.slice(0, 2).map((t) => (
                      <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}

              {list.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                  Drop candidates here
                </p>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}
