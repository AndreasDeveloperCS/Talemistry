/**
 * Thin client for the legacy `backend/` NestJS API (Evryka, being adapted to
 * Talemistry). Mirrors the try-remote-else-null pattern already used by
 * app/api/analytics/route.ts for NEST_API_URL, but targets `backend/`'s
 * unversioned `/api` prefix (see backend/src/main.ts setGlobalPrefix('api')),
 * not services/api's `/api/v1`.
 */

const BASE = process.env.BACKEND_API_URL?.replace(/\/$/, "")

/** Legacy PositionsController.getAllAsync requires page/size and a parseable
 *  filterParams JSON array (an unfiltered request throws server-side). */
export async function backendGetPositions(): Promise<Record<string, unknown>[] | null> {
  if (!BASE) return null
  try {
    const qs = new URLSearchParams({
      page: "0",
      size: "200",
      filterParams: "[]",
    })
    const res = await fetch(`${BASE}/api/positions?${qs}`, { cache: "no-store" })
    if (!res.ok) return null
    const body = await res.json()
    return Array.isArray(body?.items) ? body.items : null
  } catch {
    return null
  }
}

export async function backendGetPositionById(id: string): Promise<Record<string, unknown> | null> {
  if (!BASE) return null
  try {
    const res = await fetch(`${BASE}/api/positions/${id}`, { cache: "no-store" })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
