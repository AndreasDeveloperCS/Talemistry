import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "tal_session"

function getSecret() {
  const secret = process.env.AUTH_SECRET || "talemistry-dev-secret-change-me"
  return new TextEncoder().encode(secret)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value

  let authed = false
  if (token) {
    try {
      await jwtVerify(token, getSecret())
      authed = true
    } catch {
      authed = false
    }
  }

  // Protect the dashboard.
  if (pathname.startsWith("/dashboard")) {
    if (!authed) {
      const url = req.nextUrl.clone()
      url.pathname = "/signin"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Keep authed users out of the auth pages.
  if ((pathname === "/signin" || pathname === "/signup") && authed) {
    const url = req.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/signup"],
}
