import Link from "next/link"
import { Video, Phone, MapPin, Clock, Users, Code2, ClipboardCheck, CheckCircle2 } from "lucide-react"
import { Topbar } from "@/components/app/topbar"
import { Card, Badge, Avatar, Button } from "@/components/ui/primitives"
import { INTERVIEWS } from "@/lib/data"
import { getInterviews } from "@/lib/repos"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

const typeTone: Record<string, string> = {
  Prescreen: "#545454",
  Technical: "#208e2d",
  "Live Coding": "#5b5585",
  Behavioral: "#4fd1a8",
  Panel: "#0b1b2a",
  Final: "#ae0301",
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function InterviewCard({ i }: { i: (typeof INTERVIEWS)[number] }) {
  const ModeIcon = i.mode === "Video" ? Video : i.mode === "Phone" ? Phone : MapPin
  const isLiveCoding = i.type === "Live Coding"
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={i.candidateName} size={44} />
          <div>
            <Link
              href={`/dashboard/candidates/${i.candidateId}`}
              className="text-sm font-semibold text-foreground hover:text-primary"
            >
              {i.candidateName}
            </Link>
            <p className="text-xs text-muted-foreground">{i.jobTitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatDate(i.start)} · {timeOf(i.start)}</span>
              <span className="inline-flex items-center gap-1"><ModeIcon className="h-3.5 w-3.5" />{i.mode} · {i.durationMin}m</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{i.interviewers.join(", ")}</span>
            </div>
          </div>
        </div>
        <Badge style={{ backgroundColor: `${typeTone[i.type]}1a`, color: typeTone[i.type] }}>{i.type}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {i.status === "scheduled" ? (
          <>
            <Button asChild size="sm">
              <Link href={`/dashboard/interviews/room?interview=${i.id}`}>
                {isLiveCoding ? <Code2 className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                {isLiveCoding ? "Open coding room" : "Join room"}
              </Link>
            </Button>
            <Button variant="outline" size="sm">Reschedule</Button>
          </>
        ) : i.scorecardDone ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
            <CheckCircle2 className="h-4 w-4" /> Scorecard submitted
          </span>
        ) : (
          <Button asChild size="sm" variant="dark">
            <Link href={`/dashboard/interviews/scorecard?interview=${i.id}`}>
              <ClipboardCheck className="h-4 w-4" /> Complete scorecard
            </Link>
          </Button>
        )}
      </div>
    </Card>
  )
}

export default async function InterviewsPage() {
  const live = await getInterviews().catch(() => [])
  const data = live.length > 0 ? live : INTERVIEWS
  const upcoming = data.filter((i) => i.status === "scheduled").sort(
    (a, b) => +new Date(a.start) - +new Date(b.start),
  )
  const completed = data.filter((i) => i.status === "completed")

  return (
    <>
      <Topbar title="Interviews" subtitle="Structured evaluations across the hiring team" />
      <main className="mx-auto w-full max-w-[1100px] flex-1 space-y-8 p-5 md:p-7">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-foreground">Upcoming ({upcoming.length})</h2>
            <Button size="sm" variant="outline">Schedule interview</Button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {upcoming.map((i) => (
              <InterviewCard key={i.id} i={i} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-serif text-base font-semibold text-foreground">Awaiting feedback & completed</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {completed.map((i) => (
              <InterviewCard key={i.id} i={i} />
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
