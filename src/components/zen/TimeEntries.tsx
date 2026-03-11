'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { useDataStore } from '@/stores'

function fmtDuration(sec: number) {
  if (!sec) return '0:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `0:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtClock(v: unknown) {
  try {
    return (v instanceof Date ? v : new Date(String(v)))
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch { return '' }
}

function isToday(v: unknown) {
  try {
    const d = (v instanceof Date ? v : new Date(String(v)))
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  } catch { return false }
}

export default function TimeEntries() {
  const { recentEntries, isLoadingEntries, deleteTimeEntry } = useDataStore()

  const entries = recentEntries.filter(e => isToday(e.start_time))

  return (
    <div className="bento-card p-5 lg:p-6 animate-fade-in h-full" style={{ animationDelay: '300ms' }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Today&apos;s Entries
      </p>

      {isLoadingEntries ? (
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted) / 0.08)' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-muted-foreground/50 text-xs py-8">No entries yet</p>
      ) : (
        <div className="space-y-1">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-2xl transition-colors duration-200 group"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs text-foreground truncate">
                  {entry.description || 'Untitled entry'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }}
                  />
                  <p className="text-[10px] text-muted-foreground truncate">
                    {(entry as any).project?.name || '—'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 tabular-time hidden sm:block">
                {fmtClock(entry.start_time)}
              </p>
              <p className="text-xs font-medium tabular-time text-foreground">
                {fmtDuration(entry.duration)}
              </p>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Edit entry"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => deleteTimeEntry(String(entry.id))}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
