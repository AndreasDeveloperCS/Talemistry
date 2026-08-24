import type { WorkStyle } from "@/lib/data"

function Spectrum({ left, right, value }: { left: string; right: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted">
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow"
          style={{ left: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function WorkStylePanel({ ws }: { ws: WorkStyle }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#5b5585]/8 p-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#5b5585] font-serif text-sm font-bold text-white">
          {ws.mbti}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{ws.mbtiLabel}</p>
          <p className="text-xs text-muted-foreground">Work-style indicator · human-supervised</p>
        </div>
      </div>
      <div className="space-y-4">
        <Spectrum left="Flexible" right="Structured" value={ws.discipline} />
        <Spectrum left="Independent" right="Collaborative" value={ws.collaboration} />
        <Spectrum left="Reflective" right="Fast-paced" value={ws.pace} />
        <Spectrum left="Detail" right="Big-picture" value={ws.focus} />
      </div>
    </div>
  )
}
