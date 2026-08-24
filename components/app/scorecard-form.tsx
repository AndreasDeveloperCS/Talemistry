"use client"

import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown, Minus, CheckCircle2 } from "lucide-react"
import { Card, Avatar, Button } from "@/components/ui/primitives"
import { cn } from "@/lib/utils"
import type { Interview } from "@/lib/data"

const COMPETENCIES = [
  { key: "technical", label: "Technical depth", hint: "Problem solving, code quality, system design" },
  { key: "communication", label: "Communication", hint: "Clarity, structure, listening" },
  { key: "collaboration", label: "Collaboration", hint: "Teamwork, feedback, humility" },
  { key: "culture", label: "Values alignment", hint: "Motivation, ownership, growth mindset" },
]

type Rec = "strong-yes" | "yes" | "no" | "strong-no" | null

export function ScorecardForm({
  interview,
  candidateSummary,
}: {
  interview: Interview
  candidateSummary: string
}) {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [rec, setRec] = useState<Rec>(null)
  const [submitted, setSubmitted] = useState(false)

  const avg =
    Object.values(ratings).length > 0
      ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1)
      : "—"

  if (submitted) {
    return (
      <Card className="flex flex-col items-center p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-serif text-xl font-semibold text-foreground">Scorecard submitted</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Your structured feedback for {interview.candidateName} is recorded and shared with the hiring panel to reduce
          bias in the decision stage.
        </p>
        <Button className="mt-5" onClick={() => setSubmitted(false)} variant="outline">
          Edit response
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={interview.candidateName} size={48} />
          <div>
            <p className="font-serif text-base font-semibold text-foreground">{interview.candidateName}</p>
            <p className="text-sm text-muted-foreground">{interview.jobTitle}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-serif text-2xl font-semibold text-primary">{avg}</p>
            <p className="text-xs text-muted-foreground">avg rating</p>
          </div>
        </div>
        {candidateSummary ? (
          <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{candidateSummary}</p>
        ) : null}
      </Card>

      <Card className="space-y-5 p-5">
        {COMPETENCIES.map((c) => (
          <div key={c.key}>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.hint}</p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRatings((r) => ({ ...r, [c.key]: n }))}
                    aria-label={`${c.label} rating ${n}`}
                    className="transition"
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        (ratings[c.key] ?? 0) >= n ? "fill-[#208e2d] text-[#208e2d]" : "text-border",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder={`Evidence for ${c.label.toLowerCase()}…`}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              rows={2}
            />
          </div>
        ))}
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-foreground">Hiring recommendation</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { key: "strong-yes", label: "Strong yes", icon: ThumbsUp, tone: "#176b25" },
            { key: "yes", label: "Yes", icon: ThumbsUp, tone: "#24af4f" },
            { key: "no", label: "No", icon: ThumbsDown, tone: "#d1a18f" },
            { key: "strong-no", label: "Strong no", icon: ThumbsDown, tone: "#ae0301" },
          ].map((o) => {
            const Icon = o.icon
            const active = rec === o.key
            return (
              <button
                key={o.key}
                onClick={() => setRec(o.key as Rec)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm font-medium transition",
                  active ? "text-white" : "border-border bg-card text-foreground hover:bg-muted",
                )}
                style={active ? { backgroundColor: o.tone, borderColor: o.tone } : undefined}
              >
                <Icon className="h-4 w-4" />
                {o.label}
              </button>
            )
          })}
        </div>
        <Button className="mt-5 w-full" onClick={() => setSubmitted(true)} disabled={!rec}>
          Submit scorecard
        </Button>
      </Card>
    </div>
  )
}
