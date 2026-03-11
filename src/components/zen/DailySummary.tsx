'use client'

import { useMemo } from 'react'
import { Flame, Target, Clock } from 'lucide-react'
import { useDataStore } from '@/stores'

const GaugeRing = ({
  value,
  max,
  size = 48,
  strokeWidth = 4,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
}) => {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = c - pct * c

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        className="text-muted/15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-primary"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  )
}

function fmtHm(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

export default function DailySummary() {
  const { dashboardSummary, recentEntries } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const focusPct = total > 0 ? Math.round((billable / total) * 100) : 0

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
    <div className="bento-card p-5 flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Today</p>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
          <Clock size={18} className="text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-2xl font-light tabular-time text-foreground">{fmtHm(total)}</p>
          <p className="text-[10px] text-muted-foreground/60">Total tracked</p>
        </div>
      </div>

      <div className="h-px" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <GaugeRing value={focusPct} max={100} size={40} strokeWidth={3.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Target size={12} className="text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{focusPct}%</p>
            <p className="text-[10px] text-muted-foreground/60">Billable</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <Flame size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{streak} {streak === 1 ? 'day' : 'days'}</p>
            <p className="text-[10px] text-muted-foreground/60">Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
