import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { collection } from "./mongodb"

export const SESSION_COOKIE = "tal_session"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type AccountRole = "admin" | "hr_director" | "hiring_manager" | "recruiter"

export interface Account {
  id: string
  email: string
  name: string
  role: AccountRole
  passwordHash: string
  createdAt: string
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: AccountRole
}

function getSecret() {
  const secret = process.env.AUTH_SECRET || "talemistry-dev-secret-change-me"
  return new TextEncoder().encode(secret)
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
    id: `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    name: input.name.trim(),
    role: input.role ?? "recruiter",
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  await col.insertOne(doc as Record<string, unknown>)
  return doc
}

function normalizeAccount(doc: Record<string, unknown>): Account {
  return {
    id: String(doc.id ?? doc._id),
    email: String(doc.email),
    name: String(doc.name ?? ""),
    role: (doc.role as AccountRole) ?? "recruiter",
    passwordHash: String(doc.passwordHash ?? ""),
    createdAt: String(doc.createdAt ?? ""),
  }
}
