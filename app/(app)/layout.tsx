import type React from "react"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/app/sidebar"
import { getSession } from "@/lib/auth"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect("/signin")

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
