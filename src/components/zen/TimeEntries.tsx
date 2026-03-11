// Time entries list
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
function fmtTime(sec: number) {
  if (!sec) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function fmtClock(v: unknown) {
  try { return (v instanceof Date ? v : new Date(String(v))).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }
  catch { return '' }
}

const TABS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'all',   label: 'All'   },
]

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
      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Time Entries</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{entries.length} entries</p>
        </div>
        <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setPeriod(t.id)}
              className="tag text-[11px] px-2.5 py-1"
              style={period === t.id
                ? { background: 'hsl(var(--card))', color: 'hsl(var(--primary))', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }
                : { color: 'hsl(var(--muted-foreground))' }
              }
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-0">
        {isLoadingEntries ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted) / 0.3)' }} />
          ))
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'hsl(var(--muted) / 0.4)' }}>
              <Clock size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No entries for this period</p>
          </div>
        ) : entries.map(entry => (
          <div key={entry.id}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-colors group cursor-default"
            style={{ background: 'hsl(var(--card) / 0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card))'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card) / 0.5)'}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate leading-none">
                {entry.description || (entry as any).project?.name || 'No description'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {(entry as any).project?.name || '—'} · {fmtClock(entry.start_time)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entry.is_billable && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' }}>$</span>
              )}
              <span className="text-xs font-mono text-muted-foreground tabular-time">{fmtTime(entry.duration)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
