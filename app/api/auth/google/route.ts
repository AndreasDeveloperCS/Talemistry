import type { NextRequest } from "next/server"
import { selfServiceRole } from "@/lib/auth"
import {
  buildAuthorizationUrl,
  createGoogleFlow,
  getGoogleConfig,
  redirectTo,
  safeNextPath,
  setGoogleFlowCookie,
} from "@/lib/google-oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Start "Continue with Google": redirect to Google's consent screen. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const mode = params.get("mode") === "signup" ? "signup" : "signin"

  const config = getGoogleConfig()
  if (!config) {
    return redirectTo(`/${mode}?error=google_unavailable`)
  }

  const flow = createGoogleFlow({
    mode,
    next: safeNextPath(params.get("next")),
    role: selfServiceRole(params.get("role")),
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI || new URL("/api/auth/google/callback", req.url).toString(),
  })

  const res = redirectTo(buildAuthorizationUrl(config.clientId, flow))
  await setGoogleFlowCookie(res, flow)
  return res
}
