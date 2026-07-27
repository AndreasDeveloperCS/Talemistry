"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  KanbanSquare,
  CalendarClock,
  ClipboardCheck,
  Scale,
  FileSignature,
  BarChart3,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TalemistryMark } from "@/components/brand/logo"

const NAV_GROUPS: {
  label: string
  items: { label: string; href: string; icon: typeof LayoutDashboard; badge?: string }[]
}[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Recruit",
    items: [
      { label: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
      { label: "Pipeline", href: "/dashboard/pipeline", icon: KanbanSquare },
      { label: "Candidates", href: "/dashboard/candidates", icon: Users },
    ],
  },
  {
    label: "Evaluate",
    items: [
      { label: "Interviews", href: "/dashboard/interviews", icon: CalendarClock },
      { label: "Assessments", href: "/dashboard/assessments", icon: ClipboardCheck },
      { label: "Decisions", href: "/dashboard/decisions", icon: Scale },
      { label: "Offers", href: "/dashboard/offers", icon: FileSignature },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
      { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[#0b1b2a] lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <TalemistryMark />
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-[0.18em] text-white">TALEMISTRY</span>
          <span className="mt-0.5 text-[8px] font-medium tracking-wide text-[#64708a]">
            by Nomado Innovations
          </span>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Product">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#64708a]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-white/10 text-white"
                          : "text-[#8ea0b5] hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className={cn("h-4.5 w-4.5", active && "text-[#4fd1a8]")} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-[#4fd1a8]">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold text-white">Pipeline Copilot</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#8ea0b5]">
          3 candidates in tech screening for 14+ days. Action needed.
        </p>
        <Link
          href="/dashboard/pipeline"
          className="mt-3 inline-block text-xs font-semibold text-[#4fd1a8] hover:underline"
        >
          Review pipeline →
        </Link>
      </div>
    </aside>
  )
}
