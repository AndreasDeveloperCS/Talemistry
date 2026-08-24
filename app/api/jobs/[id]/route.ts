import { NextResponse } from "next/server"
import { backendGetPositionById } from "@/lib/backend-client"
import { mapPositionToJob } from "@/lib/translate/job"
import { getJobById } from "@/lib/repos"
import { JOBS } from "@/lib/data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const position = await backendGetPositionById(id)
  if (position) {
    return NextResponse.json({ ok: true, job: mapPositionToJob(position), source: "backend" })
  }

  try {
    const job = await getJobById(id)
    if (job) return NextResponse.json({ ok: true, job, source: "mongo" })
  } catch (err) {
    console.log("[v0] /api/jobs/[id] mongo fallback failed:", (err as Error).message)
  }

  const seedJob = JOBS.find((j) => j.id === id)
  if (seedJob) return NextResponse.json({ ok: true, job: seedJob, source: "seed" })

  return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 })
}
