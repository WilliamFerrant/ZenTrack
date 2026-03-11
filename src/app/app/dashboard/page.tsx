'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'
import TimerCard    from '@/components/zen/TimerCard'
import DailySummary from '@/components/zen/DailySummary'
import NowPlaying   from '@/components/zen/NowPlaying'
import QuickActions from '@/components/zen/QuickActions'
import ProjectsGrid from '@/components/zen/ProjectsGrid'
import TimeEntries  from '@/components/zen/TimeEntries'

export default function DashboardPage() {
  const { fetchRecentEntries, fetchProjects, fetchDashboardSummary } = useDataStore()
  const { isRunning, startTimer } = useTimerStore()

  useEffect(() => {
    fetchRecentEntries(50)
    fetchProjects()
    fetchDashboardSummary('day')
  }, []) // eslint-disable-line

  return (
    <div className="p-3 lg:p-4 overflow-y-auto">
      <div className="grid grid-cols-12 gap-3 lg:gap-4 auto-rows-min max-w-[1600px] mx-auto">

        {/* Row 1 — QuickActions | Timer | Daily+NowPlaying */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 lg:gap-4">
          <QuickActions />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <TimerCard />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:gap-4">
          <DailySummary />
          <NowPlaying />
        </div>

        {/* Row 2 — Projects | TimeEntries */}
        <div className="col-span-12 lg:col-span-7">
          <ProjectsGrid />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <TimeEntries />
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { if (!isRunning) startTimer().catch(() => {}) }}
        className="fixed bottom-6 right-6 h-12 px-5 flex items-center justify-center gap-2 rounded-full font-medium glow-primary glow-primary-hover transition-all duration-300 hover:-translate-y-1 active:scale-95 z-50 text-sm"
        style={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        }}
      >
        <Plus size={18} />
        New Timer
      </button>
    </div>
  )
}
