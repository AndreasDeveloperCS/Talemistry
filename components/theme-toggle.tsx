"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"
  const next = isDark ? "light" : "dark"
  const label = mounted ? `Switch to ${next} mode` : "Toggle theme"

  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setTheme(next)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground",
          className,
        )}
      >
        {/* Render both; avoid hydration mismatch by only revealing after mount */}
        {mounted ? (
          isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />
        ) : (
          <Sun className="h-4 w-4 opacity-0" aria-hidden />
        )}
      </button>
    </Tooltip>
  )
}
