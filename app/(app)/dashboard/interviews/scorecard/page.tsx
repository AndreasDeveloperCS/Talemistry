import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Topbar } from "@/components/app/topbar"
import { ScorecardForm } from "@/components/app/scorecard-form"
import { INTERVIEWS, getCandidate } from "@/lib/data"

export default async function ScorecardPage({
  searchParams,
}: {
  searchParams: Promise<{ interview?: string }>
}) {
  const { interview: interviewId } = await searchParams
  const interview = INTERVIEWS.find((i) => i.id === interviewId) ?? INTERVIEWS[0]
  const candidate = getCandidate(interview.candidateId)

  return (
    <>
      <Topbar title="Interview Scorecard" subtitle={`${interview.type} · ${interview.candidateName}`} />
      <main className="mx-auto w-full max-w-[820px] flex-1 space-y-5 p-5 md:p-7">
        <Link
          href="/dashboard/interviews"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to interviews
        </Link>
        <ScorecardForm interview={interview} candidateSummary={candidate?.summary ?? ""} />
      </main>
    </>
  )
}
