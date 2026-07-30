"use client"

import { cn } from "@/lib/utils"

/**
 * Lightweight CSS-only tooltip. Wraps a trigger and reveals a label on
 * hover/focus-within. Used for icon-only navigation on narrow screens.
 */
export function Tooltip({
  label,
  children,
  side = "bottom",
  className,
}: {
  label: string
  children: React.ReactNode
  side?: "top" | "bottom"
  className?: string
}) {
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
        )}
      >
        {label}
      </span>
    </span>
  )
}
