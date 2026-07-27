"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, ArrowRight } from "lucide-react"
import { TalemistryLogo } from "@/components/brand/logo"
import { Button } from "@/components/ui/primitives"

const NAV = [
  { label: "Platform", href: "#ecosystem" },
  { label: "Candidate intelligence", href: "#philosophy" },
  { label: "Responsible AI", href: "#trust" },
  { label: "Candidates", href: "#candidate" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-[#fafafa]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Talemistry home">
          <TalemistryLogo showEndorsement />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[#545454] transition-colors hover:text-[#0b1b2a]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
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
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#0b1b2a] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-[#fafafa] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#545454] hover:bg-secondary"
              >
                {item.label}
              </a>
            ))}
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
