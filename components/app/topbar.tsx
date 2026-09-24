"use client"

import { Search, Bell, Plus, HelpCircle, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/app/user-menu"
import { useSidebar } from "@/components/app/sidebar"

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { setOpen } = useSidebar()
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-3 border-b border-border bg-background/85 px-4 py-3.5 backdrop-blur-md sm:px-5 md:flex-row md:items-center md:justify-between md:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" aria-hidden />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-lg font-semibold text-foreground md:text-xl">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden items-center lg:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Search talent, roles, notes..."
            aria-label="Search"
            className="h-9 w-64 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <ThemeToggle />

        <button
          type="button"
          aria-label="Help"
          className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground sm:flex"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
        >
          <Bell className="h-4 w-4" aria-hidden />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-secondary" />
        </button>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">New role</span>
        </button>

        <UserMenu />
      </div>
    </header>
  )
}
