// Weekly stats bar chart
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

function fmtHM(sec: number) {
  if (!sec) return '0h'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h` : `${m}m`
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function WeekStats() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get<any>('/dashboard/summary?period=week').then(setData).catch(() => {})
  }, [])

  const bars: Array<{ date: string; total_time: number }> = data?.daily_breakdown ?? []
  const weekTotal = data?.totals?.total_time ?? 0
  const billable  = data?.totals?.billable_time ?? 0
  const max = Math.max(...bars.map(b => b.total_time), 1)
  const todayIdx = (new Date().getDay() + 6) % 7 // Mon=0

  return (
    <div className="bento-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">This Week</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{fmtHM(billable)} billable</p>
        </div>
        <p className="text-xl font-bold tabular-time text-foreground">{fmtHM(weekTotal)}</p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-14">
        {DAY_LABELS.map((d, i) => {
          const entry = bars[i]
          const h = entry ? (entry.total_time / max) * 100 : 0
          const isToday = i === todayIdx
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full rounded-sm transition-all duration-500"
                style={{
                  height: `${Math.max(h, 3)}%`,
                  background: isToday
                    ? 'hsl(var(--primary))'
                    : h > 0 ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--muted) / 0.4)',
                  minHeight: '3px',
                }} />
              <span className="text-[9px]"
                style={{ color: isToday ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)' }}>
                {d}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
