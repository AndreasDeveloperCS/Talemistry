import { Suspense } from "react"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Create account · Talemistry",
  description: "Create your Talemistry recruitment workspace account.",
}

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your team's human-supervised recruitment workspace."
    >
      <Suspense fallback={null}>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  )
}
