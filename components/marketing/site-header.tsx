"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, ArrowRight, Layers, Atom, ShieldCheck, Users, type LucideIcon } from "lucide-react"
import { TalemistryLogo } from "@/components/brand/logo"
import { Button } from "@/components/ui/primitives"
import { Tooltip } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Platform", href: "#ecosystem", icon: Layers },
  { label: "Candidate intelligence", href: "#philosophy", icon: Atom },
  { label: "Responsible AI", href: "#trust", icon: ShieldCheck },
  { label: "Candidates", href: "#candidate", icon: Users },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Talemistry home">
          <TalemistryLogo showEndorsement />
        </Link>

        {/* Primary nav: icon + tooltip on narrow, icon + name on wide */}
        <nav className="hidden items-center gap-1 md:flex xl:gap-2" aria-label="Primary">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <Tooltip key={item.label} label={item.label}>
                <a
                  href={item.href}
                  aria-label={item.label}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground xl:px-3"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden xl:inline">{item.label}</span>
                </a>
              </Tooltip>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Explore Talemistry <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </a>
              )
            })}
            <Link href="/dashboard" className="mt-2">
              <Button className="w-full">
                Explore Talemistry <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
