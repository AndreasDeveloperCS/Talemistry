import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { InterviewRoom } from "@/components/app/interview-room"
import { INTERVIEWS } from "@/lib/data"

export default async function RoomPage({
  searchParams,
}: {
  searchParams: Promise<{ interview?: string }>
}) {
  const { interview: interviewId } = await searchParams
  const interview = INTERVIEWS.find((i) => i.id === interviewId) ?? INTERVIEWS[0]

  return (
    <>
      <header className="flex h-16 items-center gap-3 border-b border-border bg-background px-5">
        <Link
          href="/dashboard/interviews"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Interviews
        </Link>
        <span className="text-sm font-semibold text-foreground">Live Evaluation Room</span>
      </header>
      <InterviewRoom interview={interview} />
    </>
  )
}
