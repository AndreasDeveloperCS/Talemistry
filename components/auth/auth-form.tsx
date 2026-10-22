"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/primitives"
import { Loader2 } from "lucide-react"

type Mode = "signin" | "signup"

const ROLE_OPTIONS = [
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
  // { value: "hr_director", label: "HR Director" },
  { value: "talent", label: "Talent" }
  // { value: "admin", label: "Administrator" },
]

/** `?error=` codes set by /api/auth/google and its callback. */
const GOOGLE_ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in isn't available right now. Please use your email and password.",
  google_cancelled: "Google sign-in was cancelled.",
  google_unverified: "Your Google account's email address isn't verified.",
  google_state: "Your Google sign-in session expired. Please try again.",
  google_failed: "Google sign-in failed. Please try again.",
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/dashboard"

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(() => GOOGLE_ERRORS[params.get("error") ?? ""] ?? null)
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "recruiter",
  })

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin"
      const payload =
        mode === "signup"
          ? form
          : { email: form.email, password: form.password }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setLoading(false)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"

  const googleHref = `/api/auth/google?${new URLSearchParams(
    mode === "signup" ? { mode, next, role: form.role } : { mode, next },
  )}`

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {mode === "signup" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={update("name")}
            placeholder="Isabella Moreau"
            className={inputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Work email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
          placeholder="you@company.com"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          value={form.password}
          onChange={update("password")}
          placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
          className={inputClass}
        />
      </div>

      {mode === "signup" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium text-foreground">
            Your role
          </label>
          <select id="role" value={form.role} onChange={update("role")} className={inputClass}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Full-page navigation to the OAuth route, so a plain <a> rather than next/link. */}
      <Button asChild variant="outline" size="lg" className="w-full">
        <a href={googleHref}>
          <GoogleIcon />
          Continue with Google
        </a>
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Talemistry?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
