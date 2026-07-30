import Link from "next/link"
import { TalemistryMark } from "@/components/brand/logo"

const COLS = [
  {
    title: "Ecosystem",
    links: ["Discover", "Attract", "Understand", "Match", "Evaluate", "Decide", "Offer"],
  },
  {
    title: "Product",
    links: ["Recruiter dashboard", "Candidate intelligence", "Interview rooms", "Assessments", "Analytics"],
  },
  {
    title: "Company",
    links: ["About Nomado", "Responsible AI", "Careers", "Contact", "Privacy policy"],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted text-muted-foreground dark:bg-[#0b1b2a]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <TalemistryMark />
              <span className="text-[15px] font-bold tracking-[0.18em] text-foreground">TALEMISTRY</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              A full-cycle AI recruitment ecosystem that unifies job publication, candidate discovery,
              assessment, interviews, decisions and offers in one human-supervised platform.
            </p>
            <p className="mt-6 text-xs font-medium tracking-wide text-muted-foreground">
              Talemistry · Nomado Innovations
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {COLS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="/dashboard"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 Nomado Innovations. All rights reserved. talemistry.com</p>
          <p className="font-medium text-primary">Reveal the chemistry of human potential.</p>
        </div>
      </div>
    </footer>
  )
}
