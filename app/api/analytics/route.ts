import { NextResponse } from "next/server"
import { computeLiveAnalytics, type LiveFilters } from "@/lib/analytics-live"

// Always run on the Node.js runtime (Mongoose needs Node APIs) and never cache.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const filters: LiveFilters = {
    range: searchParams.get("range") ?? "12m",
    viewerId: searchParams.get("viewerId") ?? "all",
    recruiterId: searchParams.get("recruiterId") ?? "all",
    skill: searchParams.get("skill") ?? "all",
  }

  // If a standalone NestJS API is configured, proxy to it so both backends
  // stay interchangeable. Otherwise compute locally against MongoDB.
  const nestUrl = process.env.NEST_API_URL
  if (nestUrl) {
    try {
      const qs = new URLSearchParams({ ...filters }).toString()
      const res = await fetch(`${nestUrl.replace(/\/$/, "")}/api/v1/live/analytics?${qs}`, {
        cache: "no-store",
      })
      if (res.ok) return NextResponse.json(await res.json())
      console.log("[v0] NestJS proxy returned", res.status, "- falling back to local compute")
    } catch (err) {
      console.log("[v0] NestJS proxy unreachable, falling back to local compute:", (err as Error).message)
    }
  }

  try {
    const data = await computeLiveAnalytics(filters)
    return NextResponse.json({ ok: true, ...data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.log("[v0] /api/analytics error:", message)
    return NextResponse.json(
      { ok: false, error: message, meta: { source: "error" } },
      { status: 500 },
    )
  }
}
