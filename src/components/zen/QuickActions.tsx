// Quick actions panel
'use client'

import { useRouter } from 'next/navigation'
import { useTimerStore, useDataStore } from '@/stores'
import { Play, Square, FolderPlus, BarChart2, Clock } from 'lucide-react'

function fmtHM(sec: number) {
  if (!sec) return '0h 0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${m}m`
}

export default function QuickActions() {
  const router = useRouter()
  const {
    isRunning, isStarting, isStopping, currentTimer, elapsedTime,
    startTimer, stopTimer,
  } = useTimerStore()
  const { dashboardSummary, projects } = useDataStore()

  const handleToggleTimer = async () => {
    try { isRunning ? await stopTimer() : await startTimer() } catch {}
  }

  const totalToday = dashboardSummary?.totals?.total_time ?? 0

  return (
    <div className="bento-card p-5 flex flex-col gap-4 h-full">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Shortcuts</p>
      </div>

      {/* Active timer status */}
      {isRunning && currentTimer && (
        <div className="rounded-2xl p-3 flex flex-col gap-1"
          style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--primary))' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
            Timer running
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {currentTimer.description || currentTimer.project?.name || 'No description'}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button onClick={handleToggleTimer} disabled={isStarting || isStopping}
          className={`btn-primary-zen w-full py-3 text-sm glow-primary glow-primary-hover ${
            isRunning ? 'bg-destructive text-destructive-foreground' : ''
          }`}
          style={isRunning ? { background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' } : {}}
        >
          {isRunning
            ? <><Square size={14} fill="currentColor" /> {isStopping ? 'Stopping…' : 'Stop Timer'}</>
            : <><Play size={14} fill="currentColor" /> {isStarting ? 'Starting…' : 'Start Timer'}</>
          }
        </button>

        <button onClick={() => router.push('/app/tracking')}
          className="btn-ghost-zen w-full py-2.5 text-sm justify-start gap-3 px-3"
          style={{ background: 'hsl(var(--card) / 0.5)', borderRadius: '0.875rem' }}
        >
          <Clock size={15} /> Tracking page
        </button>

        <button onClick={() => router.push('/app/projects')}
          className="btn-ghost-zen w-full py-2.5 text-sm justify-start gap-3 px-3"
          style={{ background: 'hsl(var(--card) / 0.5)', borderRadius: '0.875rem' }}
        >
          <FolderPlus size={15} /> New project
        </button>

        <button onClick={() => router.push('/app/reports')}
          className="btn-ghost-zen w-full py-2.5 text-sm justify-start gap-3 px-3"
          style={{ background: 'hsl(var(--card) / 0.5)', borderRadius: '0.875rem' }}
        >
          <BarChart2 size={15} /> Reports
        </button>
      </div>

      {/* Today mini stat */}
      <div className="mt-auto pt-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <p className="text-xs text-muted-foreground">Today</p>
        <p className="text-2xl font-bold tabular-time text-foreground mt-0.5">{fmtHM(totalToday)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{projects.length} projects</p>
      </div>
    </div>
  )
}
