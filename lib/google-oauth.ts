import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose"
import { getSecret, type AccountRole } from "./auth"

/**
 * Google sign-in (OAuth 2.0 authorization-code flow with PKCE).
 *
 *   /api/auth/google            → Google consent screen
 *   GOOGLE_REDIRECT_URI         → Google redirects back here. In production this is
 *                                 https://api.talemistry.com/auth/google/callback (the URI
 *                                 registered on the OAuth client); nginx forwards it, query
 *                                 intact, to /api/auth/google/callback on talemistry.com so
 *                                 the session cookie is set for the site's own host.
 *   /api/auth/google/callback   → verifies state + ID token, signs the user in.
 */

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"]
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"))

export const GOOGLE_FLOW_COOKIE = "tal_google_oauth"
const FLOW_COOKIE_PATH = "/api/auth/google"
const FLOW_MAX_AGE = 60 * 10 // 10 minutes to complete the consent screen

export type GoogleFlowMode = "signin" | "signup"

/** Per-attempt values round-tripped through a signed, short-lived cookie. */
export interface GoogleFlow {
  state: string
  verifier: string
  nonce: string
  redirectUri: string
  mode: GoogleFlowMode
  next: string
  role: AccountRole
}

export interface GoogleProfile {
  googleId: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
}

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/dashboard"
  }
  return value
}

/** Redirect with a relative Location so it stays on whatever host served the request. */
export function redirectTo(location: string) {
  return new NextResponse(null, { status: 302, headers: { Location: location } })
}

function randomToken() {
  return randomBytes(32).toString("base64url")
}

export function createGoogleFlow(input: Pick<GoogleFlow, "redirectUri" | "mode" | "next" | "role">): GoogleFlow {
  return { ...input, state: randomToken(), verifier: randomToken(), nonce: randomToken() }
}

export function buildAuthorizationUrl(clientId: string, flow: GoogleFlow) {
  const url = new URL(AUTHORIZE_URL)
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: flow.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: createHash("sha256").update(flow.verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString()
  return url.toString()
}

export async function setGoogleFlowCookie(res: NextResponse, flow: GoogleFlow) {
  const token = await new SignJWT({ ...flow })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${FLOW_MAX_AGE}s`)
    .sign(getSecret())
  res.cookies.set(GOOGLE_FLOW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax is required: the callback arrives as a top-level navigation from Google.
    sameSite: "lax",
    path: FLOW_COOKIE_PATH,
    maxAge: FLOW_MAX_AGE,
  })
}

export function clearGoogleFlowCookie(res: NextResponse) {
  res.cookies.set(GOOGLE_FLOW_COOKIE, "", { path: FLOW_COOKIE_PATH, maxAge: 0 })
}

export async function readGoogleFlow(token: string | undefined): Promise<GoogleFlow | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as GoogleFlow
  } catch {
    return null
  }
}

/** Exchange the authorization code and return the profile from the verified ID token. */
export async function exchangeCodeForProfile(
  config: { clientId: string; clientSecret: string },
  code: string,
  flow: GoogleFlow,
): Promise<GoogleProfile> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: flow.redirectUri,
      grant_type: "authorization_code",
      code_verifier: flow.verifier,
    }),
    cache: "no-store",
  })
  const tokens = await res.json().catch(() => ({}))
  if (!res.ok || typeof tokens.id_token !== "string") {
    throw new Error(`Google token exchange failed: ${tokens.error_description || tokens.error || res.status}`)
  }

  const { payload } = await jwtVerify(tokens.id_token, googleJwks, {
    issuer: GOOGLE_ISSUERS,
    audience: config.clientId,
  })
  if (payload.nonce !== flow.nonce) throw new Error("Google ID token nonce mismatch")
  if (!payload.sub || typeof payload.email !== "string") throw new Error("Google ID token has no email")

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : "",
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  }
}
