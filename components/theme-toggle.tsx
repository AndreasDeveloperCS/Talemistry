"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme()

  function toggle() {
    // Read the live DOM state so the toggle is correct even before
    // next-themes has hydrated (the inline script sets `.dark` pre-paint).
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Tooltip label="Toggle theme">
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={toggle}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground",
          className,
        )}
      >
        {/* Icons are toggled purely via the `.dark` class, so the button always
            shows a real icon on first paint — no mount gating, no empty state. */}
        <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
        <Moon className="block h-4 w-4 dark:hidden" aria-hidden />
      </button>
    </Tooltip>
  )
}
