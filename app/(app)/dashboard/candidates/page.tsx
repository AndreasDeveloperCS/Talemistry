import { Topbar } from "@/components/app/topbar"
import { CandidateExplorer } from "@/components/app/candidate-explorer"
import { CANDIDATES } from "@/lib/data"

export default function CandidatesPage() {
  return (
    <>
      <Topbar title="Talent Pool" subtitle="Chemistry-ranked candidates across every open role" />
      <main className="mx-auto w-full max-w-[1400px] flex-1 p-5 md:p-7">
        <CandidateExplorer candidates={CANDIDATES} />
      </main>
    </>
  )
}
