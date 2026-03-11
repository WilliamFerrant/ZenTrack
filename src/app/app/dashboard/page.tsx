'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'
import TimerCard    from '@/components/zen/TimerCard'
import DailySummary from '@/components/zen/DailySummary'
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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Timer — 2 cols */}
        <div className="lg:col-span-2">
          <TimerCard />
        </div>

        {/* Daily summary — 1 col */}
        <div className="lg:col-span-1">
          <DailySummary />
        </div>

        {/* Projects — full width */}
        <div className="lg:col-span-3">
          <ProjectsGrid />
        </div>

        {/* Time entries — full width */}
        <div className="lg:col-span-3">
          <TimeEntries />
        </div>
      </div>

      {/* FAB — mobile only */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { if (!isRunning) startTimer().catch(() => {}) }}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 flex items-center justify-center shadow-lg lg:hidden"
        style={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          boxShadow: '0 4px 20px hsl(var(--primary) / 0.3)',
        }}
      >
        <Plus size={24} />
      </motion.button>
    </>
  )
}
