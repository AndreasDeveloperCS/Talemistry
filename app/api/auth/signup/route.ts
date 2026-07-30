import { NextResponse } from "next/server"
import { createAccount, setSessionCookie, type AccountRole } from "@/lib/auth"

export const runtime = "nodejs"

const ROLES: AccountRole[] = ["admin", "hr_director", "hiring_manager", "recruiter"]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim()
    const password = String(body.password ?? "")
    const role = ROLES.includes(body.role) ? (body.role as AccountRole) : "recruiter"

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, error: "Name, email and password are required." }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const account = await createAccount({ name, email, password, role })
    const user = { id: account.id, email: account.email, name: account.name, role: account.role }
    await setSessionCookie(user)
    return NextResponse.json({ ok: true, user })
  } catch (err) {
    const msg = (err as Error).message
    const status = msg.includes("already exists") ? 409 : 500
    return NextResponse.json({ ok: false, error: msg }, { status })
  }
}
