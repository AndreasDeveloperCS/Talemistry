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
    <footer className="bg-[#0b1b2a] text-[#c7d0dc]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <TalemistryMark />
              <span className="text-[15px] font-bold tracking-[0.18em] text-white">TALEMISTRY</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#8ea0b5]">
              A full-cycle AI recruitment ecosystem that unifies job publication, candidate discovery,
              assessment, interviews, decisions and offers in one human-supervised platform.
            </p>
            <p className="mt-6 text-xs font-medium tracking-wide text-[#64708a]">
              Talemistry · Nomado Innovations
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="/dashboard"
                      className="text-sm text-[#8ea0b5] transition-colors hover:text-[#4fd1a8]"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#64708a] sm:flex-row sm:items-center">
          <p>© 2026 Nomado Innovations. All rights reserved. talemistry.com</p>
          <p className="text-[#4fd1a8]">Reveal the chemistry of human potential.</p>
        </div>
      </div>
    </footer>
  )
}
