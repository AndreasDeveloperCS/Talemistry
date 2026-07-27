import { Topbar } from "@/components/app/topbar"
import { PipelineBoard } from "@/components/app/pipeline-board"
import { CANDIDATES } from "@/lib/data"
import { JOURNEY_STAGES } from "@/lib/journey"

export default function PipelinePage() {
  return (
    <>
      <Topbar title="Talent Pipeline" subtitle="Drag candidates across the seven-stage journey" />
      <main className="flex-1 space-y-5 p-5 md:p-7">
        {/* Journey legend */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border border-border bg-card p-3">
          {JOURNEY_STAGES.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.id} className="flex items-center">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${s.color}14`, color: s.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.name}
                </span>
                {i < JOURNEY_STAGES.length - 1 ? (
                  <span className="mx-0.5 text-muted-foreground/40">›</span>
                ) : null}
              </div>
            )
          })}
        </div>

        <PipelineBoard initial={CANDIDATES} />
      </main>
    </>
  )
}
