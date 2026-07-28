"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Avatar } from "@/components/ui/primitives"
import { LogOut, ChevronDown } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  hr_director: "HR Director",
  hiring_manager: "Hiring Manager",
  recruiter: "Recruiter",
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function UserMenu() {
  const router = useRouter()
  const { data } = useSWR("/api/auth/me", fetcher)
  const [open, setOpen] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const user = data?.user as { name: string; email: string; role: string } | null | undefined

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  async function signOut() {
    setSigningOut(true)
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/signin")
    router.refresh()
  }

  const name = user?.name || "Loading…"
  const role = user ? ROLE_LABELS[user.role] ?? "Team member" : ""

  return (
    <div ref={ref} className="relative pl-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-secondary"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} size={34} />
        <div className="hidden leading-tight xl:block">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground xl:block" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  )
}
