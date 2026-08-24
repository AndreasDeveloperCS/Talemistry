import { NextResponse } from "next/server"
import { backendGetPositions } from "@/lib/backend-client"
import { mapPositionToJob } from "@/lib/translate/job"
import { getJobs } from "@/lib/repos"
import { JOBS } from "@/lib/data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const positions = await backendGetPositions()
  if (positions) {
    return NextResponse.json({ ok: true, jobs: positions.map(mapPositionToJob), source: "backend" })
  }

  try {
    const jobs = await getJobs()
    if (jobs.length > 0) return NextResponse.json({ ok: true, jobs, source: "mongo" })
  } catch (err) {
    console.log("[v0] /api/jobs mongo fallback failed:", (err as Error).message)
  }

  return NextResponse.json({ ok: true, jobs: JOBS, source: "seed" })
}
