import { Topbar } from "@/components/app/topbar"
import { AnalyticsView } from "@/components/app/analytics-view"

export default function AnalyticsPage() {
  return (
    <>
      <Topbar title="Recruitment Analytics" subtitle="Pipeline health, velocity and team performance" />
      <AnalyticsView />
    </>
  )
}
