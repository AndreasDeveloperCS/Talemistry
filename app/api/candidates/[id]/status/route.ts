import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { updateCandidateStatus } from "@/lib/repos"
import { PIPELINE_STAGES, type PipelineStatus } from "@/lib/journey"

const VALID = new Set(PIPELINE_STAGES.map((s) => s.id))

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const status = body?.status as PipelineStatus

  if (!status || !VALID.has(status)) {
    return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 })
  }

  try {
    const updated = await updateCandidateStatus(id, status)
    if (!updated) return NextResponse.json({ ok: false, error: "Candidate not found" }, { status: 404 })
    return NextResponse.json({ ok: true, candidate: updated })
  } catch (err) {
    console.log("[v0] candidate status update failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 })
  }
}
