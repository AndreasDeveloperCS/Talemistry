import type { Metadata } from "next"
import { Topbar } from "@/components/app/topbar"
import { Card, Badge, Button, Progress } from "@/components/ui/primitives"
import { ASSESSMENTS, type AssessmentKind } from "@/lib/data"
import { Code2, Brain, Users, Sparkles, Timer, ShieldCheck, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Assessments",
  description: "Skills tests, live coding, psychometric and culture-add assessments in the Talemistry evaluation suite.",
}

const KIND_META: Record<AssessmentKind, { label: string; tone: "teal" | "violet" | "green" | "amber"; icon: typeof Code2 }> = {
  skills: { label: "Skills", tone: "teal", icon: Code2 },
  psychometric: { label: "Work Style", tone: "violet", icon: Brain },
  culture: { label: "Culture-Add", tone: "green", icon: Users },
  cognitive: { label: "Cognitive", tone: "amber", icon: Sparkles },
}

export default function AssessmentsPage() {
  const totalAssigned = ASSESSMENTS.reduce((s, a) => s + a.assigned, 0)
  const totalCompleted = ASSESSMENTS.reduce((s, a) => s + a.completed, 0)

  return (
    <>
      <Topbar
        title="Assessment Suite"
        subtitle="Understand & Evaluate — verified skills and team chemistry, free of bias."
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Assessments live</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{ASSESSMENTS.length}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Invitations sent</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{totalAssigned}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Completion rate</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {Math.round((totalCompleted / totalAssigned) * 100)}%
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {ASSESSMENTS.map((a) => {
            const meta = KIND_META[a.kind]
            const Icon = meta.icon
            const rate = Math.round((a.completed / a.assigned) * 100)
            return (
              <Card key={a.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-medium leading-tight text-balance">{a.name}</h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Timer className="h-3.5 w-3.5" aria-hidden />
                          {a.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {a.proctored && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Proctored
                    </span>
                  )}
                  {a.autoScored && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" aria-hidden /> Auto-scored
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {a.completed} of {a.assigned} completed
                    </span>
                    <span>{rate}%</span>
                  </div>
                  <Progress value={rate} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="text-sm">
                    {a.avgScore > 0 ? (
                      <span className="text-muted-foreground">
                        Avg score <span className="font-semibold text-foreground">{a.avgScore}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Qualitative signal</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Preview
                    </Button>
                    <Button size="sm">Assign</Button>
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
