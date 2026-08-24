import { Suspense } from "react"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Sign in · Talemistry",
  description: "Sign in to your Talemistry recruitment workspace.",
}

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Talemistry workspace.">
      <Suspense fallback={null}>
        <AuthForm mode="signin" />
      </Suspense>
      <p className="mt-6 rounded-lg border border-border bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        Demo login — <span className="font-medium text-foreground">admin@talemistry.com</span> /{" "}
        <span className="font-medium text-foreground">Talemistry!2026</span>
      </p>
    </AuthShell>
  )
}
