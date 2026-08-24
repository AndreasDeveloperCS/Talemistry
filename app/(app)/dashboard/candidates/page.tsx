import { Topbar } from "@/components/app/topbar"
import { CandidateExplorer } from "@/components/app/candidate-explorer"
import { getCandidates } from "@/lib/repos"
import { CANDIDATES } from "@/lib/data"

export const dynamic = "force-dynamic"

export default async function CandidatesPage() {
  const live = await getCandidates().catch(() => [])
  const candidates = live.length > 0 ? live : CANDIDATES

  return (
    <>
      <Topbar title="Talent Pool" subtitle="Chemistry-ranked candidates across every open role" />
      <main className="mx-auto w-full max-w-[1400px] flex-1 p-5 md:p-7">
        <CandidateExplorer candidates={candidates} />
      </main>
    </>
  )
}
