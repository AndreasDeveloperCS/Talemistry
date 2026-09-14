import { NextResponse } from "next/server"
import { findAccountByEmail, verifyPassword, setSessionCookie } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log(body);
    const email = String(body.email ?? "").trim()
    const password = String(body.password ?? "")

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 })
    }

    const account = await findAccountByEmail(email)
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 })
    }

    const user = { id: account.id, email: account.email, name: account.name, role: account.role }
    await setSessionCookie(user)
    return NextResponse.json({ ok: true, user })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
