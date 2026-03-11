// Daily summary — sage-tinted bento card
'use client'

import { useDataStore } from '@/stores'
import { TrendingUp } from 'lucide-react'

function fmtHM(sec: number) {
  if (!sec) return '0h 0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${m}m`
}

export default function DailySummary() {
  const { dashboardSummary, isLoadingDashboard } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const nEntries = dashboardSummary?.totals?.total_entries ?? 0
  const goalPct  = Math.min(Math.round((total / (8 * 3600)) * 100), 100)
  const billPct  = total > 0 ? Math.round((billable / total) * 100) : 0

  if (isLoadingDashboard) {
    return <div className="bento-sage p-5 h-36 animate-pulse rounded-3xl" />
  }

  return (
    <div className="bento-sage p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Today</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{nEntries} {nEntries === 1 ? 'entry' : 'entries'}</p>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
          <TrendingUp size={15} strokeWidth={2} />
        </div>
      </div>

      {/* Big time */}
      <p className="text-3xl font-bold tabular-time text-foreground leading-none mb-3">
        {fmtHM(total)}
      </p>

      {/* Stats row */}
      <div className="flex gap-3 text-xs">
        <div className="flex-1">
          <p className="text-muted-foreground mb-1">Billable</p>
          <p className="font-semibold tabular-time" style={{ color: 'hsl(var(--primary))' }}>
            {fmtHM(billable)} <span className="text-muted-foreground font-normal">({billPct}%)</span>
          </p>
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground mb-1">Goal</p>
          <p className="font-semibold" style={{ color: goalPct >= 100 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
            {goalPct}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${goalPct}%`, background: 'hsl(var(--primary))' }} />
      </div>
    </div>
  )
}
