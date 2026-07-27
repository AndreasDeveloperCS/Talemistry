import { cn } from "@/lib/utils"

/**
 * Talemistry element mark — connected talent points (candidate, role, team,
 * organization) resolving into one coherent structure. Graphite/navy → green
 * transition expresses discovery and growth, with a single red signature spark.
 */
export function TalemistryMark({ className, spark = true }: { className?: string; spark?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="tlm-mark" x1="6" y1="34" x2="34" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#383C5B" />
          <stop offset="0.5" stopColor="#126F66" />
          <stop offset="1" stopColor="#24AF4F" />
        </linearGradient>
      </defs>
      {/* connecting edges */}
      <g stroke="url(#tlm-mark)" strokeWidth="1.8" strokeLinecap="round" opacity="0.9">
        <line x1="20" y1="6" x2="9" y2="26" />
        <line x1="20" y1="6" x2="31" y2="26" />
        <line x1="9" y1="26" x2="31" y2="26" />
        <line x1="20" y1="6" x2="20" y2="20" />
        <line x1="9" y1="26" x2="20" y2="20" />
        <line x1="31" y1="26" x2="20" y2="20" />
      </g>
      {/* nodes */}
      <circle cx="20" cy="6" r="3.4" fill="#0B1B2A" />
      <circle cx="9" cy="26" r="3.4" fill="#208E2D" />
      <circle cx="31" cy="26" r="3.4" fill="#126F66" />
      <circle cx="20" cy="20" r="3" fill="url(#tlm-mark)" />
      {spark && <circle cx="31" cy="26" r="1.2" fill="#AE0301" />}
    </svg>
  )
}

export function TalemistryLogo({
  className,
  variant = "dark",
  showEndorsement = false,
}: {
  className?: string
  variant?: "dark" | "light"
  showEndorsement?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <TalemistryMark />
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[15px] font-bold tracking-[0.18em]",
            variant === "dark" ? "text-[#0b1b2a]" : "text-white",
          )}
        >
          TALEMISTRY
        </span>
        {showEndorsement && (
          <span className="mt-1 text-[9px] font-medium tracking-wide text-[#8e8a99]">
            by Nomado Innovations
          </span>
        )}
      </div>
    </div>
  )
}
