import type { Metadata } from "next"
import { Topbar } from "@/components/app/topbar"
import { Card, Badge, Button } from "@/components/ui/primitives"
import { EXTERNAL_DASHBOARDS } from "@/lib/data"
import { MiniArea } from "@/components/app/charts"
import { Plug, ArrowUpRight, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Integrations & External Dashboards",
  description:
    "Connect PostHog, Google Analytics, Stripe, ATS and BI dashboards into a single Talemistry intelligence layer.",
}

const STATUS = {
  connected: { tone: "green" as const, icon: CheckCircle2, label: "Connected" },
  syncing: { tone: "teal" as const, icon: RefreshCw, label: "Syncing" },
  "action-needed": { tone: "amber" as const, icon: AlertTriangle, label: "Action needed" },
}

const EMBED_TREND = [
  { label: "Mon", value: 1820 },
  { label: "Tue", value: 2110 },
  { label: "Wed", value: 1990 },
  { label: "Thu", value: 2481 },
  { label: "Fri", value: 2320 },
  { label: "Sat", value: 1240 },
  { label: "Sun", value: 980 },
]

export default function IntegrationsPage() {
  const connected = EXTERNAL_DASHBOARDS.filter((d) => d.status === "connected").length

  return (
    <>
      <Topbar
        title="Integrations & External Dashboards"
        subtitle="One intelligence layer — bring every recruiting signal into Talemistry."
      />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Connected sources</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{connected}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Data freshness</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">4m</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Unified events / day</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">2.4k</p>
          </Card>
        </div>

        {/* Embedded external dashboard preview */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-secondary text-xs font-bold text-secondary-foreground">
                  P
                </span>
                <h2 className="font-serif text-lg font-semibold">PostHog — Careers funnel</h2>
              </div>
              <p className="text-sm text-muted-foreground">Embedded live view · product analytics on the careers site</p>
            </div>
            <Button variant="outline" size="sm">
              Open in PostHog
              <ArrowUpRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MiniArea data={EMBED_TREND} height={220} />
            </div>
            <div className="space-y-3">
              {[
                { step: "Careers page views", value: "12,480", pct: 100 },
                { step: "Job detail views", value: "4,920", pct: 39 },
                { step: "Application started", value: "1,610", pct: 13 },
                { step: "Application submitted", value: "742", pct: 6 },
              ].map((s) => (
                <div key={s.step}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{s.step}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Connectors */}
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold">Connected dashboards & tools</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXTERNAL_DASHBOARDS.map((d) => {
              const meta = STATUS[d.status as keyof typeof STATUS]
              const Icon = meta.icon
              return (
                <Card key={d.name} className="flex flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
                        {d.name[0]}
                      </div>
                      <div>
                        <h3 className="font-medium leading-tight">{d.name}</h3>
                        <p className="text-xs text-muted-foreground">{d.category}</p>
                      </div>
                    </div>
                    <Badge tone={meta.tone}>
                      <Icon className="mr-1 h-3.5 w-3.5" aria-hidden />
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{d.metric}</p>
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm">
                      Configure
                    </Button>
                  </div>
                </Card>
              )
            })}
            <Card className="flex flex-col items-center justify-center gap-2 border-dashed p-5 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Plug className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm font-medium">Add a connector</p>
              <p className="text-xs text-muted-foreground">BI tools, ATS, CRM, HRIS and more</p>
              <Button size="sm" className="mt-1">
                Browse marketplace
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
