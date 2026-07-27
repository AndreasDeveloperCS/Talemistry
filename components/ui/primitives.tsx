import * as React from "react"
import { cn, initials } from "@/lib/utils"

/* ----------------------------- Button ----------------------------- */
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark"
type ButtonSize = "sm" | "md" | "lg" | "icon"

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-[#145c20] shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-[#e6e8ea]",
  outline: "border border-border bg-card text-foreground hover:bg-secondary",
  ghost: "text-foreground hover:bg-secondary",
  danger: "bg-destructive text-destructive-foreground hover:bg-[#870201]",
  dark: "bg-[#0b1b2a] text-white hover:bg-[#12263b]",
}
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  icon: "h-9 w-9",
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(({ className, variant = "primary", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
      buttonVariants[variant],
      buttonSizes[size],
      className,
    )}
    {...props}
  />
))
Button.displayName = "Button"

/* ----------------------------- Card ----------------------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card text-card-foreground", className)}
      {...props}
    />
  )
}

/* ----------------------------- Badge ----------------------------- */
type BadgeTone = "neutral" | "green" | "teal" | "violet" | "navy" | "red" | "copper" | "amber"
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  green: "bg-[#e8f3ea] text-[#176b25]",
  teal: "bg-[#e0f2ef] text-[#0f5f57]",
  violet: "bg-[#eceaf3] text-[#5b5585]",
  navy: "bg-[#e7ecf2] text-[#0b1b2a]",
  red: "bg-[#fbe9e9] text-[#ae0301]",
  copper: "bg-[#f6ece7] text-[#a86a52]",
  amber: "bg-[#fbf1e2] text-[#a86619]",
}
export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  )
}

/* ----------------------------- Avatar ----------------------------- */
export function Avatar({
  name,
  src,
  size = 36,
  className,
  tone = "#383c5b",
}: {
  name: string
  src?: string
  size?: number
  className?: string
  tone?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        className,
      )}
      style={{ width: size, height: size, backgroundColor: tone, fontSize: size * 0.38 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src || "/placeholder.svg"} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

/* ----------------------------- Progress ----------------------------- */
export function Progress({
  value,
  className,
  color = "#208e2d",
  track = "#e9ecef",
}: {
  value: number
  className?: string
  color?: string
  track?: string
}) {
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full", className)}
      style={{ backgroundColor: track }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  )
}

/* ----------------------------- Section heading ----------------------------- */
export function StatDelta({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        positive ? "text-[#176b25]" : "text-[#ae0301]",
      )}
    >
      {positive ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  )
}
