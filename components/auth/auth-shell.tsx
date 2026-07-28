import Link from "next/link"
import { TalemistryLogo, TalemistryMark } from "@/components/brand/logo"

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden gradient-discovery p-12 lg:flex">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <TalemistryMark />
          <span className="text-[15px] font-bold tracking-[0.18em] text-white">TALEMISTRY</span>
        </Link>
        <div className="relative z-10">
          <h2 className="max-w-md text-balance text-3xl font-bold leading-tight text-white">
            Reveal the chemistry of human potential.
          </h2>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-white/80">
            Full-cycle AI recruitment — job publication, candidate discovery, assessment, interviews,
            decisions and offers in one human-supervised platform.
          </p>
        </div>
        <p className="relative z-10 text-xs font-medium tracking-wide text-white/60">
          Talemistry · Nomado Innovations
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <TalemistryLogo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}
