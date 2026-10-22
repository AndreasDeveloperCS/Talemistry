import type { NextRequest } from "next/server"
import { findOrCreateGoogleAccount, setSessionCookie } from "@/lib/auth"
import {
  GOOGLE_FLOW_COOKIE,
  clearGoogleFlowCookie,
  exchangeCodeForProfile,
  getGoogleConfig,
  readGoogleFlow,
  redirectTo,
} from "@/lib/google-oauth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Google redirects here (via api.talemistry.com in production) after consent. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const flow = await readGoogleFlow(req.cookies.get(GOOGLE_FLOW_COOKIE)?.value)

  function fail(error: string) {
    const res = redirectTo(`/${flow?.mode ?? "signin"}?error=${error}`)
    clearGoogleFlowCookie(res)
    return res
  }

  const googleError = params.get("error")
  if (googleError) {
    return fail(googleError === "access_denied" ? "google_cancelled" : "google_failed")
  }

  const code = params.get("code")
  if (!flow || !code || params.get("state") !== flow.state) {
    return fail("google_state")
  }

  const config = getGoogleConfig()
  if (!config) return fail("google_unavailable")

  try {
    const profile = await exchangeCodeForProfile(config, code, flow)
    if (!profile.emailVerified) return fail("google_unverified")

    const account = await findOrCreateGoogleAccount({ ...profile, role: flow.role })
    await setSessionCookie({ id: account.id, email: account.email, name: account.name, role: account.role })

    const res = redirectTo(flow.next)
    clearGoogleFlowCookie(res)
    return res
  } catch (err) {
    console.error("Google sign-in failed:", (err as Error).message)
    return fail("google_failed")
  }
}
