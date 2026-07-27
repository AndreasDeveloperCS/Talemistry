import { JOURNEY_STAGES } from "@/lib/journey"

export function JourneyBand() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
      {JOURNEY_STAGES.map((stage, i) => {
        const Icon = stage.icon
        return (
          <div
            key={stage.id}
            className="group relative flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${stage.color}2e`, color: "#e8f0f7" }}
            >
              <Icon className="h-5 w-5" style={{ color: stage.color === "#ae0301" ? "#ff8f8d" : stage.color }} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-semibold text-[#4fd1a8]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-sm font-semibold text-white">{stage.name}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#8ea0b5]">{stage.scope}</p>
          </div>
        )
      })}
    </div>
  )
}
