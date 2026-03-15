'use client'

import { useEffect } from 'react'
import { useDataStore } from '@/stores'
import TimerCard    from '@/components/zen/TimerCard'
import TimeEntries  from '@/components/zen/TimeEntries'
import WeekCalendar from '@/components/zen/WeekCalendar'
import ProjectsGrid from '@/components/zen/ProjectsGrid'
import KpiCard      from '@/components/zen/KpiCard'

const BOTTOM_ROW_H = 320
const GAP = 16

export default function DashboardPage() {
  const { fetchRecentEntries, fetchProjects, fetchDashboardSummary } = useDataStore()

  useEffect(() => {
    fetchRecentEntries(50)
    fetchProjects()
    fetchDashboardSummary('week')
  }, []) // eslint-disable-line

  return (
    <div className="p-4 flex flex-col gap-4" style={{ height: '100vh' }}>

      {/* ── Ligne haute ────────────────────────────────────────── */}
      <div className="flex gap-4 min-h-0" style={{ flex: '1 1 0' }}>

        {/* WeekCalendar */}
        <div className="bento-card flex-1 min-w-0 min-h-0" style={{ overflow: 'hidden' }}>
          <div className="calendar-scroll h-full overflow-y-auto p-4">
            <WeekCalendar />
          </div>
        </div>

        {/* Projects — même hauteur que le WeekCalendar */}
        <div className="min-h-0 overflow-y-auto" style={{ width: '280px', flexShrink: 0 }}>
          <ProjectsGrid />
        </div>

      </div>

      {/* ── Ligne basse : 3 cartes ──────────────────────────────── */}
      <div className="flex gap-4" style={{ height: `${BOTTOM_ROW_H}px`, flexShrink: 0 }}>

        <div className="flex-1 min-w-0 overflow-hidden">
          <TimeEntries />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <KpiCard />
        </div>

        <div className="min-w-0 overflow-hidden" style={{ width: '280px', flexShrink: 0 }}>
          <TimerCard compact />
        </div>

      </div>

    </div>
  )
}
