import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { collection } from "./mongodb"

export const SESSION_COOKIE = "tal_session"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type AccountRole = "admin" | "hr_director" | "hiring_manager" | "recruiter"

/** Roles a user may pick for themselves at sign-up; "admin" is never self-assignable. */
const SELF_SERVICE_ROLES: AccountRole[] = ["hr_director", "hiring_manager", "recruiter"]

export function selfServiceRole(value: unknown): AccountRole {
  return SELF_SERVICE_ROLES.includes(value as AccountRole) ? (value as AccountRole) : "recruiter"
}

export interface Account {
  id: string
  email: string
  name: string
  role: AccountRole
  /** Empty for accounts created through Google sign-in (no password login). */
  passwordHash: string
  googleId?: string
  createdAt: string
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: AccountRole
}

export function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not configured")
  }
  return new TextEncoder().encode(secret || "talemistry-dev-secret-change-me")
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as AccountRole,
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/** Read the current session from the request cookie (server components / routes). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/* ---------------- Account repository (talemistry `accounts`) ---------------- */

export async function findAccountByEmail(email: string): Promise<Account | null> {
  const col = await collection("accounts")
  const doc = await col.findOne({ email: email.toLowerCase() })
  return doc ? normalizeAccount(doc) : null
}

export async function createAccount(input: {
  email: string
  name: string
  password: string
  role?: AccountRole
}): Promise<Account> {
  const col = await collection("accounts")
  const email = input.email.toLowerCase()
  const existing = await col.findOne({ email })
  if (existing) throw new Error("An account with this email already exists")

  const passwordHash = await hashPassword(input.password)
  const doc = {
    id: newAccountId(),
    email,
    name: input.name.trim(),
    role: input.role ?? "recruiter",
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  await col.insertOne(doc as Record<string, unknown>)
  return doc
}

/**
 * Resolve the account for a verified Google identity: match on the Google
 * subject first, then link an existing account with the same email, otherwise
 * create a password-less account ("sign up with Google").
 */
export async function findOrCreateGoogleAccount(input: {
  googleId: string
  email: string
  name: string
  picture?: string
  role?: AccountRole
}): Promise<Account> {
  const col = await collection("accounts")
  const email = input.email.toLowerCase()

  const existing = (await col.findOne({ googleId: input.googleId })) ?? (await col.findOne({ email }))
  if (existing) {
    if (existing.googleId !== input.googleId) {
      await col.updateOne({ _id: existing._id }, { $set: { googleId: input.googleId } })
    }
    return normalizeAccount(existing)
  }

  const doc = {
    id: newAccountId(),
    email,
    name: input.name.trim() || email.split("@")[0],
    role: input.role ?? "recruiter",
    passwordHash: "",
    googleId: input.googleId,
    avatarUrl: input.picture,
    createdAt: new Date().toISOString(),
  }
  await col.insertOne(doc as Record<string, unknown>)
  return normalizeAccount(doc)
}

function newAccountId() {
  return `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeAccount(doc: Record<string, unknown>): Account {
  return {
    id: String(doc.id ?? doc._id),
    email: String(doc.email),
    name: String(doc.name ?? ""),
    role: (doc.role as AccountRole) ?? "recruiter",
    passwordHash: String(doc.passwordHash ?? ""),
    googleId: doc.googleId ? String(doc.googleId) : undefined,
    createdAt: String(doc.createdAt ?? ""),
  }
}
