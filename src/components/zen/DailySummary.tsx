'use client'

import { useMemo } from 'react'
import { useDataStore } from '@/stores'
import { Zap } from 'lucide-react'

function fmtHM(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

// Small ring for the billable % stat
function MiniRing({ pct, size = 32 }: { pct: number; size?: number }) {
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--primary) / 0.2)" strokeWidth="3" />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="3"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      )}
    </svg>
  )
}

export default function DailySummary() {
  const { dashboardSummary, recentEntries, isLoadingDashboard } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const goalPct  = Math.min((total / (8 * 3600)), 1)
  const billPct  = total > 0 ? Math.round((billable / total) * 100) : 0

  // Streak: consecutive days with at least one entry
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

  if (isLoadingDashboard) {
    return <div className="bento-card animate-pulse rounded-3xl" style={{ height: 160 }} />
  }

  return (
    <div className="bento-card p-5 flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Today</p>

      {/* Big time */}
      <div>
        <p className="text-3xl font-bold tabular-time text-foreground leading-none">
          {fmtHM(total)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Total tracked</p>
      </div>

      {/* Stats row: billable circle + streak */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <MiniRing pct={billPct / 100} size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tabular-time">{billPct}%</p>
            <p className="text-[10px] text-muted-foreground">Billable</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            <Zap size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{streak} days</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
        </div>
      </div>

      {/* Goal progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Daily goal</span>
          <span className="tabular-time">{Math.round(goalPct * 100)}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${goalPct * 100}%`, background: 'hsl(var(--primary))' }} />
        </div>
      </div>
    </div>
  )
}
