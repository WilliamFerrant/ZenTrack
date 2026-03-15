'use client'

import { useMemo } from 'react'
import { Clock, Flame, TrendingUp } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'

function fmtHm(sec: number) {
  if (!sec || sec <= 0) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

function Divider() {
  return <div className="h-px w-full" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />
}

export default function KpiCard() {
  const { dashboardSummary, recentEntries } = useDataStore()
  const { elapsedTime, isRunning } = useTimerStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const liveTotal = total + (isRunning ? elapsedTime : 0)
  const billablePct = liveTotal > 0 ? Math.round((billable / liveTotal) * 100) : 0

  // Week total from daily breakdown
  const weekTotal = useMemo(() => {
    return (dashboardSummary?.daily_breakdown ?? []).reduce(
      (sum, d) => sum + (d.total_time ?? 0), 0
    )
  }, [dashboardSummary])

  // Streak
  const streak = useMemo(() => {
    const seen = new Set(
      recentEntries.map(e => {
        const d = new Date(e.start_time instanceof Date ? e.start_time : String(e.start_time))
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )
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
    <div className="bento-card p-5 flex flex-col gap-4 h-full">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Stats</p>

      {/* Today total */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl shrink-0" style={{ background: 'hsl(var(--primary) / 0.12)' }}>
          <Clock size={16} className="text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-2xl font-light tabular-time text-foreground leading-tight">{fmtHm(liveTotal)}</p>
          <p className="text-[10px] text-muted-foreground/60">tracked today</p>
        </div>
        {billablePct > 0 && (
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            {billablePct}% billable
          </span>
        )}
      </div>

      <Divider />

      {/* This week */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl shrink-0" style={{ background: 'hsl(var(--muted) / 0.15)' }}>
          <TrendingUp size={16} className="text-muted-foreground" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-xl font-light tabular-time text-foreground leading-tight">{fmtHm(weekTotal)}</p>
          <p className="text-[10px] text-muted-foreground/60">this week</p>
        </div>
      </div>

      <Divider />

      {/* Streak */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl shrink-0" style={{ background: 'hsl(var(--primary) / 0.12)' }}>
          <Flame size={16} className="text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-xl font-light text-foreground leading-tight">
            {streak} <span className="text-sm text-muted-foreground font-normal">{streak === 1 ? 'day' : 'days'}</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60">streak in a row</p>
        </div>
      </div>
    </div>
  )
}
