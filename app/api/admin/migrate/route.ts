import { NextResponse } from "next/server"
import { runMigration } from "@/lib/migrate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * One-time migration + seed endpoint.
 * Protected by a key so it cannot be triggered casually. Pass it as
 *   POST /api/admin/migrate?key=<TALEMISTRY_SEED_KEY>
 * Default dev key is used only when the env var is not set.
 */
const SEED_KEY = process.env.TALEMISTRY_SEED_KEY || "talemistry-migrate"

export async function POST(req: Request) {
  const url = new URL(req.url)
  const key = url.searchParams.get("key") ?? req.headers.get("x-seed-key")
  if (key !== SEED_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const report = await runMigration()
    return NextResponse.json({ ok: true, ...report })
  } catch (err) {
    console.log("[v0] migration failed:", (err as Error).message)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
