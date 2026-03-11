'use client'

import { motion } from 'framer-motion'
import { Edit2, Trash2, Clock } from 'lucide-react'
import { useDataStore } from '@/stores'

function fmtHM(sec: number) {
  if (!sec) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}
function fmtClock(v: unknown) {
  try {
    return (v instanceof Date ? v : new Date(String(v)))
      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '' }
}

export default function TimeEntries() {
  const { recentEntries, isLoadingEntries, deleteTimeEntry } = useDataStore()

  // show today's entries by default
  const today = new Date()
  const entries = recentEntries.filter(e => {
    const d = new Date(e.start_time instanceof Date ? e.start_time : String(e.start_time))
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="glass-card overflow-hidden"
    >
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground">Today's Entries</h2>
      </div>

      {isLoadingEntries ? (
        <div className="px-6 pb-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse"
              style={{ background: 'hsl(var(--secondary) / 0.5)' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3"
          style={{ borderTop: '1px solid hsl(var(--border) / 0.05)' }}>
          <Clock size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No entries today</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.05)' }}>
          {entries.map(entry => (
            <div key={entry.id}
              className="flex items-center justify-between px-6 py-4 group transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--secondary) / 0.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              {/* Description + project */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground truncate">
                    {entry.description || 'Untitled entry'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }} />
                  <span className="text-xs text-muted-foreground truncate">
                    {(entry as any).project?.name || '—'}
                  </span>
                </div>
              </div>

              {/* Time + actions */}
              <div className="flex items-center gap-5 flex-shrink-0">
                <span className="font-mono text-xs text-muted-foreground">
                  {fmtClock(entry.start_time)}
                </span>
                <span className="font-medium text-sm tabular-nums text-foreground w-14 text-right">
                  {fmtHM(entry.duration)}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteTimeEntry(String(entry.id))}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
