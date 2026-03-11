'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useDataStore } from '@/stores'

// SVG circle-as-path gauge (matches reference exactly)
const CIRC = 2 * Math.PI * 15.9155   // ≈ 100

function SummaryCard({
  title, value, gaugeValue, delay = 0,
}: {
  title: string; value: string; gaugeValue?: number; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + delay, ease: [0.32, 0.72, 0, 1] }}
      className="glass-card p-5"
    >
      <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{title}</h3>
      <div className="flex items-end justify-between mt-2">
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
        {gaugeValue !== undefined && (
          <div className="w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--muted) / 0.15)" strokeWidth="3"
              />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.3))' }}
                initial={{ strokeDasharray: `0, ${CIRC}` }}
                animate={{ strokeDasharray: `${(gaugeValue / 100) * CIRC}, ${CIRC}` }}
                transition={{ duration: 1, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function fmtHM(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}`
}

export default function DailySummary() {
  const { dashboardSummary, recentEntries } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const billPct  = total > 0 ? Math.round((billable / total) * 100) : 0

  const streak = useMemo(() => {
    const seen = new Set(recentEntries.map(e => {
      const d = new Date(e.start_time instanceof Date ? e.start_time : String(e.start_time))
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))
    let count = 0
    const d = new Date()
    while (count < 365) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!seen.has(key)) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [recentEntries])

  return (
    <div className="space-y-4">
      <SummaryCard title="Total Today"     value={fmtHM(total)}     delay={0}    />
      <SummaryCard title="Billable"        value={`${billPct}%`}    gaugeValue={billPct} delay={0.05} />
      <SummaryCard title="Current Streak"  value={`${streak} Day${streak !== 1 ? 's' : ''}`} delay={0.1} />
    </div>
  )
}
