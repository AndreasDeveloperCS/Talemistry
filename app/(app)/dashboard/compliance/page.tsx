import type { Metadata } from "next"
import { Topbar } from "@/components/app/topbar"
import { Card, Badge, Button, Progress } from "@/components/ui/primitives"
import { relativeTime } from "@/lib/utils"
import { ShieldCheck, FileText, ScaleIcon, Lock, Trash2, Download } from "lucide-react"

export const metadata: Metadata = {
  title: "Compliance & Trust",
  description: "GDPR, consent, audit trail and bias monitoring — hiring that is fair, transparent and defensible.",
}

const CONTROLS = [
  { name: "GDPR data processing", status: "compliant", detail: "DPA signed · EU data residency" },
  { name: "Candidate consent capture", status: "compliant", detail: "100% of active candidates consented" },
  { name: "Right to be forgotten", status: "compliant", detail: "Automated erasure workflow enabled" },
  { name: "EEO / bias monitoring", status: "monitored", detail: "Adverse-impact checks on every stage" },
  { name: "AI decision transparency", status: "compliant", detail: "Human-in-the-loop on all scores" },
  { name: "Data retention policy", status: "review", detail: "2 roles exceed 24-month retention" },
]

const AUDIT = [
  { actor: "Diana Petrova", action: "exported candidate data for", target: "Amara Okafor", time: "2026-07-27T08:55:00" },
  { actor: "System", action: "auto-anonymized rejected candidates in", target: "Data Scientist", time: "2026-07-26T23:00:00" },
  { actor: "Maya Chen", action: "granted access to pipeline", target: "Senior Frontend Engineer", time: "2026-07-26T14:12:00" },
  { actor: "Bias Monitor", action: "ran adverse-impact analysis on", target: "Product Designer", time: "2026-07-26T09:30:00" },
  { actor: "Yuki Tanaka", action: "submitted data erasure request — completed", target: "", time: "2026-07-25T16:40:00" },
]

const STATUS_TONE = { compliant: "green", monitored: "teal", review: "amber" } as const

export default function CompliancePage() {
  return (
    <>
      <Topbar
        title="Compliance & Trust"
        subtitle="Fair, transparent and defensible hiring — by design, not by afterthought."
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: "Compliance score", value: "96", icon: ShieldCheck },
            { label: "Consented candidates", value: "100%", icon: Lock },
            { label: "Open erasure requests", value: "0", icon: Trash2 },
            { label: "Bias flags (30d)", value: "0", icon: ScaleIcon },
          ].map((s) => (
            <Card key={s.label} className="p-5">
              <s.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight">{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <h2 className="mb-4 font-serif text-lg font-semibold">Controls</h2>
            <ul className="divide-y divide-border">
              {CONTROLS.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                  <Badge tone={STATUS_TONE[c.status as keyof typeof STATUS_TONE]}>
                    {c.status === "review" ? "Needs review" : c.status}
                  </Badge>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-4 w-4" aria-hidden /> Export report
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="mr-1 h-4 w-4" aria-hidden /> View policies
              </Button>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h2 className="mb-4 font-serif text-lg font-semibold">Audit trail</h2>
            <ol className="space-y-4">
              {AUDIT.map((a, i) => (
                <li key={i} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{a.actor}</span> {a.action}{" "}
                    {a.target && <span className="font-medium">{a.target}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(a.time)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-start gap-3">
            <ScaleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--chart-2)]" aria-hidden />
            <div>
              <h3 className="font-medium">Adverse-impact analysis</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Selection rates across demographic groups are within the 80% rule at every stage. No statistically
                significant disparity detected in the last 30 days.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { stage: "Screen", value: 94 },
                  { stage: "Assess", value: 91 },
                  { stage: "Interview", value: 96 },
                  { stage: "Offer", value: 93 },
                ].map((row) => (
                  <div key={row.stage}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">{row.stage}</span>
                      <span className="font-medium">{row.value}%</span>
                    </div>
                    <Progress value={row.value} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </main>
    </>
  )
}
