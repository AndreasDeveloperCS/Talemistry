import type { Metadata } from "next"
import { Topbar } from "@/components/app/topbar"
import { Card, Badge, Button, Avatar, Progress } from "@/components/ui/primitives"
import { CANDIDATES, getJob } from "@/lib/data"
import { CheckCircle2, MinusCircle, XCircle, Users, Scale } from "lucide-react"

export const metadata: Metadata = {
  title: "Hiring Decisions",
  description: "Structured debrief and consensus decisions — evidence over gut feel, bias checks built in.",
}

type Vote = "strong-yes" | "yes" | "mixed" | "no"
const PANEL: { name: string; role: string; vote: Vote }[][] = [
  [
    { name: "Diana Petrova", role: "Hiring Manager", vote: "strong-yes" },
    { name: "Marco Rossi", role: "Tech Lead", vote: "yes" },
    { name: "Aisha Khan", role: "Peer Interviewer", vote: "yes" },
    { name: "Tom Becker", role: "Bar Raiser", vote: "mixed" },
  ],
  [
    { name: "Diana Petrova", role: "Hiring Manager", vote: "yes" },
    { name: "Lena Vogt", role: "Design Lead", vote: "strong-yes" },
    { name: "Raj Malhotra", role: "Product", vote: "yes" },
  ],
  [
    { name: "Sven Olsen", role: "Eng Manager", vote: "mixed" },
    { name: "Priya Nair", role: "Staff Engineer", vote: "no" },
    { name: "Tom Becker", role: "Bar Raiser", vote: "mixed" },
  ],
]

const VOTE_META: Record<Vote, { label: string; tone: "green" | "teal" | "amber" | "red"; icon: typeof CheckCircle2 }> = {
  "strong-yes": { label: "Strong Yes", tone: "green", icon: CheckCircle2 },
  yes: { label: "Yes", tone: "teal", icon: CheckCircle2 },
  mixed: { label: "Mixed", tone: "amber", icon: MinusCircle },
  no: { label: "No", tone: "red", icon: XCircle },
}

const VOTE_SCORE: Record<Vote, number> = { "strong-yes": 100, yes: 75, mixed: 45, no: 15 }

export default function DecisionsPage() {
  const candidates = CANDIDATES.filter((c) => ["interview", "decision", "offer"].includes(c.status)).slice(0, 3)

  return (
    <>
      <Topbar
        title="Decision Room"
        subtitle="Decide — structured debriefs that turn evidence into confident, fair decisions."
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {candidates.map((c, i) => {
          const panel = PANEL[i] ?? PANEL[0]
          const consensus = Math.round(panel.reduce((s, p) => s + VOTE_SCORE[p.vote], 0) / panel.length)
          const job = getJob(c.jobId)
          return (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} src={c.avatar} size={48} />
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {c.title} · {job?.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Panel consensus</p>
                    <p className="text-2xl font-semibold tracking-tight">{consensus}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Hold
                    </Button>
                    <Button size="sm">Advance</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" aria-hidden /> Interview panel
                  </div>
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {panel.map((p) => {
                      const meta = VOTE_META[p.vote]
                      const Icon = meta.icon
                      return (
                        <li key={p.name} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={p.name} size={32} />
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.role}</p>
                            </div>
                          </div>
                          <Badge tone={meta.tone}>
                            <Icon className="mr-1 h-3.5 w-3.5" aria-hidden />
                            {meta.label}
                          </Badge>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Scale className="h-4 w-4 text-muted-foreground" aria-hidden /> Evidence balance
                    </div>
                    {[
                      { label: "Technical skill", value: c.elements[0]?.value ?? 80 },
                      { label: "Collaboration", value: c.elements[2]?.value ?? 76 },
                      { label: "Role match", value: c.matchScore },
                    ].map((row) => (
                      <div key={row.label} className="mb-2 last:mb-0">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium">{row.value}</span>
                        </div>
                        <Progress value={row.value} />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-4 text-xs leading-relaxed text-secondary-foreground">
                    <span className="font-medium">Bias check:</span> panel scores show no significant deviation across
                    interviewers. Decision is grounded in structured evidence.
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </main>
    </>
  )
}
