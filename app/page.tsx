import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Eye,
  Atom,
  FlaskConical,
  Users,
  FileText,
  Layers,
  Brain,
  MessageSquare,
} from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { JourneyBand } from "@/components/marketing/journey-band"
import { Button, Card, Badge } from "@/components/ui/primitives"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden gradient-mesh">
          <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28 lg:px-8">
            <div className="flex flex-col justify-center">
              <Badge tone="green" className="w-fit bg-white/10 text-[#4fd1a8]">
                <Sparkles className="h-3.5 w-3.5" /> Full-Cycle AI Recruitment Ecosystem
              </Badge>
              <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Reveal the chemistry of <span className="text-gradient-growth">human potential.</span>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-[#a9b7c8]">
                Talemistry connects job publication, candidate discovery, assessment, interviews,
                decisions and offers in one human-supervised platform — so you understand candidates
                beyond the resume.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    Explore Talemistry <ArrowRight className="h-4.5 w-4.5" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                    Request a demonstration
                  </Button>
                </Link>
              </div>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
                {[
                  { v: "7 stages", l: "Unified journey" },
                  { v: "-38%", l: "Time to hire" },
                  { v: "Human", l: "Always in control" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="text-2xl font-bold text-white">{s.v}</dt>
                    <dd className="mt-1 text-xs text-[#8ea0b5]">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative flex items-center">
              <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src="/hero-collaboration.png"
                  alt="A diverse team in focused collaboration around a laptop"
                  width={720}
                  height={560}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <Card className="animate-float-slow absolute -bottom-5 -left-4 w-56 border-white/10 bg-[#0b1b2a]/90 p-4 backdrop-blur">
                <div className="flex items-center gap-2 text-[#4fd1a8]">
                  <Atom className="h-4 w-4" />
                  <span className="text-xs font-semibold">Chemistry Match</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-white">94%</p>
                <p className="text-[11px] text-[#8ea0b5]">Role · Team · Organization alignment</p>
              </Card>
            </div>
          </div>
        </section>

        {/* ---------------- Problem ---------------- */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#126f66] dark:text-[#5fd0c4]">The problem</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A resume shows experience. It does not show the whole person.
              </h2>
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
                Recruitment is fragmented across tools, evaluation stays surface-level, and
                collaboration is inconsistent. Great people are eliminated for the wrong reasons —
                and the evidence behind decisions disappears.
              </p>
              <Link href="#philosophy" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                See the difference <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Layers, t: "Fragmented tools", d: "Sourcing, ATS, assessments and interviews live in disconnected systems." },
                { icon: Eye, t: "Surface evaluation", d: "Keyword screening misses transferable skills and real potential." },
                { icon: Users, t: "Inconsistent collaboration", d: "Feedback is scattered; decisions lack shared, structured context." },
              ].map((c) => (
                <Card key={c.t} className="p-5">
                  <c.icon className="h-6 w-6 text-[#383c5b] dark:text-[#8b93c9]" />
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Philosophy ---------------- */}
        <section id="philosophy" className="border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#5b5585] dark:text-[#b6a9e6]">Candidate intelligence</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Every candidate has a unique professional formula.
              </h2>
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
                Talemistry brings together skills, motivation, working style, evidence and potential
                as connected elements — a complete, explainable Talemistry Profile.
              </p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: FlaskConical, t: "Candidate Formula", d: "A structured representation of professional characteristics supported by evidence.", tone: "violet" as const },
                { icon: Atom, t: "Talent Elements", d: "Analytical reasoning, communication, leadership, technical skill and adaptability.", tone: "green" as const },
                { icon: Users, t: "Team Chemistry", d: "An informed view of how working styles may interact within a team.", tone: "teal" as const },
                { icon: FileText, t: "Evidence Trail", d: "The source and reasoning behind every insight, rating and recommendation.", tone: "navy" as const },
              ].map((c) => (
                <Card key={c.t} className="p-6">
                  <Badge tone={c.tone} className="h-9 w-9 justify-center rounded-lg p-0">
                    <c.icon className="h-4.5 w-4.5" />
                  </Badge>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{c.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Ecosystem / Journey ---------------- */}
        <section id="ecosystem" className="relative overflow-hidden bg-[#0b1b2a]">
          <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#4fd1a8]">The ecosystem</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                One ecosystem for the complete recruitment journey.
              </h2>
              <p className="mt-5 text-pretty text-lg leading-relaxed text-[#a9b7c8]">
                Discover → Attract → Understand → Match → Evaluate → Decide → Offer.
              </p>
            </div>
            <div className="mt-14">
              <JourneyBand />
            </div>
            <div className="mt-10 text-center">
              <Link href="/dashboard">
                <Button size="lg" variant="dark" className="border border-white/15 bg-white/5 hover:bg-white/10">
                  Explore the platform <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Trust / Responsible AI ---------------- */}
        <section id="trust" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#126f66] dark:text-[#5fd0c4]">Responsible AI</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                AI-assisted insight. Human responsibility.
              </h2>
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
                AI coordinates work, analyzes information and identifies patterns. It does not reduce a
                person to a score. Talemistry supports decisions; authorized people remain accountable
                for them.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { t: "Explain the insight", d: "Show evidence and understandable reasoning behind every recommendation." },
                  { t: "Maintain human control", d: "Review, challenge, document and override AI-assisted recommendations." },
                  { t: "Preserve trust", d: "Handle candidate information carefully, transparently and securely." },
                ].map((c) => (
                  <li key={c.t} className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.t}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{c.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="overflow-hidden">
              <div className="gradient-insight p-6">
                <div className="flex items-center gap-2 text-white">
                  <Brain className="h-5 w-5" />
                  <span className="text-sm font-semibold">AI recommendation · with evidence</span>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  "The candidate shows <span className="font-semibold text-foreground">strong alignment</span> with
                  the role's analytical requirements. The interview should validate stakeholder communication."
                </p>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence Trail</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <li>· Open-source contributions (verified)</li>
                    <li>· Skills assessment: 88/100 analytical reasoning</li>
                    <li>· Prescreen notes from M. Lindqvist</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Challenge</Button>
                  <Button size="sm" variant="outline">Document rationale</Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ---------------- Candidate experience ---------------- */}
        <section id="candidate" className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div className="relative order-2 overflow-hidden rounded-2xl lg:order-1">
              <Image
                src="/candidate-experience.png"
                alt="A professional working thoughtfully, communicating dignity and agency"
                width={640}
                height={520}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#a86a52] dark:text-[#d1a18f]">Candidate experience</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Recruitment that helps people feel recognized.
              </h2>
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
                Clear expectations, timely communication, transparent stages and respectful data
                handling. Candidates are recognized as people, not processed as applications.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: MessageSquare, t: "Status transparency", d: "A 24/7 assistant answers 'where is my application?'" },
                  { icon: Users, t: "Self-scheduling", d: "Candidates book interviews without back-and-forth." },
                ].map((c) => (
                  <div key={c.t} className="rounded-xl border border-border p-4">
                    <c.icon className="h-5 w-5 text-[#126f66] dark:text-[#5fd0c4]" />
                    <p className="mt-3 text-sm font-semibold text-foreground">{c.t}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Final CTA ---------------- */}
        <section className="relative overflow-hidden gradient-discovery">
          <div className="absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Discover what your candidates are truly made of.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[#c7d0dc]">
              Full-cycle recruitment. Deeper human understanding. Human decisions, intelligently
              supported.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Experience Talemistry <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                  Talk to our team
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
