import type { Metadata } from "next"
import { Topbar } from "@/components/app/topbar"
import { Card, Badge, Button, Avatar, Progress } from "@/components/ui/primitives"
import { OFFERS } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react"

export const metadata: Metadata = {
  title: "Offers",
  description: "Offer management, multi-stakeholder approvals and acceptance-likelihood intelligence.",
}

const STATUS_TONE = {
  draft: "neutral",
  "pending-approval": "amber",
  sent: "teal",
  accepted: "green",
  declined: "red",
} as const

const STATUS_LABEL = {
  draft: "Draft",
  "pending-approval": "Pending approval",
  sent: "Sent to candidate",
  accepted: "Accepted",
  declined: "Declined",
} as const

const APPROVAL_ICON = {
  approved: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
} as const

export default function OffersPage() {
  const accepted = OFFERS.filter((o) => o.status === "accepted").length
  const outstanding = OFFERS.filter((o) => ["sent", "pending-approval"].includes(o.status)).length

  return (
    <>
      <Topbar title="Offers" subtitle="Offer — close with clarity, fairness and momentum." />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Open offers</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{OFFERS.length}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Awaiting response</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{outstanding}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{accepted}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {OFFERS.map((o) => {
            const total = o.base + o.bonus
            return (
              <Card key={o.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={o.candidateName} size={44} />
                    <div>
                      <h3 className="font-semibold leading-tight">{o.candidateName}</h3>
                      <p className="text-sm text-muted-foreground">{o.jobTitle}</p>
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-muted/60 p-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Base</p>
                    <p className="text-sm font-semibold">{formatCurrency(o.base)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bonus</p>
                    <p className="text-sm font-semibold">{formatCurrency(o.bonus)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Equity</p>
                    <p className="text-sm font-semibold">{o.equity}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden /> Acceptance likelihood
                    </span>
                    <span className="font-medium">{o.acceptanceLikelihood}%</span>
                  </div>
                  <Progress value={o.acceptanceLikelihood} />
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Approvals
                  </p>
                  <ul className="space-y-1.5">
                    {o.approvals.map((a) => {
                      const Icon = APPROVAL_ICON[a.status]
                      const color =
                        a.status === "approved"
                          ? "text-[var(--chart-2)]"
                          : a.status === "rejected"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      return (
                        <li key={a.role} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {a.role} · <span className="text-foreground">{a.name}</span>
                          </span>
                          <span className={`inline-flex items-center gap-1 ${color}`}>
                            <Icon className="h-4 w-4" aria-hidden />
                            <span className="capitalize">{a.status}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    View letter
                  </Button>
                  <Button size="sm" variant={o.status === "accepted" ? "outline" : "primary"}>
                    {o.status === "accepted" ? "Start onboarding" : "Manage"}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </main>
    </>
  )
}
