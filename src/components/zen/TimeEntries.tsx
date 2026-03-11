'use client'

import { useState } from 'react'
import { useDataStore } from '@/stores'
import { Clock } from 'lucide-react'

type Period = 'today' | 'week' | 'month' | 'all'

function isToday(v: unknown) {
  const d = v instanceof Date ? v : new Date(String(v))
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}
function isWeek(v: unknown) {
  const d = v instanceof Date ? v : new Date(String(v))
  const s = new Date(); s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0)
  return d >= s
}
function isMonth(v: unknown) {
  const d = v instanceof Date ? v : new Date(String(v))
  const t = new Date()
  return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

// HH:MM:SS like "1:10:23"
function fmtHMS(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtClock(v: unknown) {
  try {
    return (v instanceof Date ? v : new Date(String(v)))
      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '' }
}

const TAB_LABELS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'all',   label: 'All'   },
]

const HEADER_LABELS: Record<Period, string> = {
  today: "Today's Entries",
  week:  'This Week',
  month: 'This Month',
  all:   'All Entries',
}

export default function TimeEntries() {
  const [period, setPeriod] = useState<Period>('today')
  const { recentEntries, isLoadingEntries } = useDataStore()

  const entries = recentEntries.filter(e => {
    if (period === 'today') return isToday(e.start_time)
    if (period === 'week')  return isWeek(e.start_time)
    if (period === 'month') return isMonth(e.start_time)
    return true
  })

  return (
    <div className="bento-card h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            {HEADER_LABELS[period]}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{entries.length} entries</p>
        </div>
        {/* Tab pills */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: 'hsl(var(--muted) / 0.25)' }}>
          {TAB_LABELS.map(t => (
            <button key={t.id} onClick={() => setPeriod(t.id)}
              className="tag text-[11px] px-2.5 py-1 transition-all"
              style={period === t.id
                ? { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }
                : { color: 'hsl(var(--muted-foreground))' }
              }
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoadingEntries ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse my-1"
                style={{ background: 'hsl(var(--muted) / 0.2)' }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'hsl(var(--muted) / 0.4)' }}>
              <Clock size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No entries for this period</p>
          </div>
        ) : (
          <div>
            {entries.map((entry, i) => (
              <div key={entry.id}
                className="flex items-center justify-between py-3 group"
                style={{ borderBottom: i < entries.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
              >
                {/* Left: description + project */}
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-foreground truncate leading-none">
                    {entry.description || 'Untitled entry'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }} />
                    <p className="text-[11px] text-muted-foreground truncate">
                      {(entry as any).project?.name || '—'}
                    </p>
                  </div>
                </div>
                {/* Right: start time + duration */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <p className="text-[11px] text-muted-foreground tabular-time hidden sm:block">
                    {fmtClock(entry.start_time)}
                  </p>
                  <p className="text-sm font-semibold tabular-time"
                    style={{ color: 'hsl(var(--primary))' }}>
                    {fmtHMS(entry.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
