import Link from "next/link"
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react"
import { Card, Badge, Avatar } from "@/components/ui/primitives"
import { cn, relativeTime } from "@/lib/utils"

export function StatCard({
  label,
  value,
  delta,
  positive = true,
  icon: Icon,
  hint,
}: {
  label: string
  value: string
  delta?: string
  positive?: boolean
  icon: LucideIcon
  hint?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              positive ? "bg-secondary/12 text-secondary" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </span>
        ) : null}
      </div>
      <p className="mt-4 font-serif text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p> : null}
    </Card>
  )
}

export function ActivityFeed({
  items,
}: {
  items: { id: number; actor: string; action: string; target: string; time: string; tone: string }[]
}) {
  const toneMap: Record<string, string> = {
    green: "bg-secondary",
    violet: "bg-[#5b5585]",
    teal: "bg-accent",
    red: "bg-destructive",
    amber: "bg-[#d1a18f]",
  }
  return (
    <ul className="space-y-4">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3">
          <div className="relative flex flex-col items-center">
            <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", toneMap[a.tone])} />
            <span className="mt-1 w-px flex-1 bg-border" />
          </div>
          <div className="pb-1">
            <p className="text-sm leading-snug text-foreground">
              <span className="font-medium">{a.actor}</span>{" "}
              <span className="text-muted-foreground">{a.action}</span>{" "}
              <span className="font-medium">{a.target}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(a.time)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SectionCard({
  title,
  action,
  href,
  children,
  className,
}: {
  title: string
  action?: string
  href?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-base font-semibold text-foreground">{title}</h2>
        {action && href ? (
          <Link href={href} className="text-xs font-semibold text-primary hover:underline">
            {action}
          </Link>
        ) : null}
      </div>
      {children}
    </Card>
  )
}

export function CandidateRow({
  id,
  name,
  role,
  score,
  status,
  statusColor,
}: {
  id: string
  name: string
  role: string
  score: number
  status: string
  statusColor: string
}) {
  return (
    <Link
      href={`/dashboard/candidates/${id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted"
    >
      <Avatar name={name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{role}</p>
      </div>
      <Badge style={{ backgroundColor: `${statusColor}1a`, color: statusColor }}>{status}</Badge>
      <div className="w-10 text-right">
        <span className="font-serif text-sm font-semibold text-foreground">{score}</span>
      </div>
    </Link>
  )
}
