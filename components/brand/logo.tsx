import { cn } from "@/lib/utils"

/**
 * Talemistry element mark — an artistic cyclohexane ring (six carbon nodes
 * bonded in a hexagon). The graphite/navy → teal → green gradient expresses
 * discovery resolving into growth; the inner ring hints at molecular bonds and
 * a single red node is the brand's signature spark.
 */
export function TalemistryMark({ className, spark = true }: { className?: string; spark?: boolean }) {
  // Pointy-top hexagon vertices around center (20,20)
  const outer = [
    [20, 6.5],
    [31.69, 13.25],
    [31.69, 26.75],
    [20, 33.5],
    [8.31, 26.75],
    [8.31, 13.25],
  ] as const
  const inner = outer.map(([x, y]) => [20 + (x - 20) * 0.62, 20 + (y - 20) * 0.62] as const)
  const ringPath = outer.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ") + " Z"
  const innerPath = inner.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ") + " Z"

  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn("h-8 w-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="tlm-mark" x1="8" y1="34" x2="32" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#383C5B" />
          <stop offset="0.45" stopColor="#126F66" />
          <stop offset="1" stopColor="#24AF4F" />
        </linearGradient>
      </defs>

      {/* outer bond ring */}
      <path d={ringPath} stroke="url(#tlm-mark)" strokeWidth="1.9" strokeLinejoin="round" />
      {/* inner ring — molecular bond hint */}
      <path d={innerPath} stroke="url(#tlm-mark)" strokeWidth="1.1" strokeLinejoin="round" opacity="0.4" />
      {/* radial bonds from center */}
      <g stroke="url(#tlm-mark)" strokeWidth="0.9" strokeLinecap="round" opacity="0.35">
        {inner.map(([x, y], i) => (
          <line key={i} x1="20" y1="20" x2={x} y2={y} />
        ))}
      </g>

      {/* carbon nodes */}
      {outer.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.9" fill={i === 0 ? "#0B1B2A" : i === 3 ? "#208E2D" : "#126F66"} />
      ))}
      <circle cx="20" cy="20" r="2.6" fill="url(#tlm-mark)" />

      {/* signature spark */}
      {spark && <circle cx="31.69" cy="13.25" r="2.9" fill="#AE0301" />}
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
            variant === "dark" ? "text-foreground" : "text-white",
          )}
        >
          TALEMISTRY
        </span>
        {showEndorsement && (
          <span
            className={cn(
              "mt-1 text-[9px] font-medium tracking-wide",
              variant === "dark" ? "text-muted-foreground" : "text-white/60",
            )}
          >
            Nomado Innovations
          </span>
        )}
      </div>
    </div>
  )
}
