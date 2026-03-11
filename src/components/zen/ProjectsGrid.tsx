// Projects bento grid
'use client'

import { useDataStore, useTimerStore } from '@/stores'
import { FolderOpen, Play, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function fmtHM(sec: number) {
  if (!sec) return '0h'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'text-emerald-400 bg-emerald-400/10',
  ON_HOLD:   'text-amber-400   bg-amber-400/10',
  COMPLETED: 'text-sky-400     bg-sky-400/10',
  ARCHIVED:  'text-muted-foreground bg-white/5',
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, setSelectedProject, startTimer } = useTimerStore()

  const quickStart = async (p: typeof projects[0]) => {
    setSelectedProject(p)
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <div className="bento-card h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/app/projects"
          className="btn-ghost-zen px-3 py-1.5 text-xs"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {/* Grid */}
      {isLoadingProjects ? (
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--card))' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'hsl(var(--muted))' }}>
            <FolderOpen size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Link href="/app/projects"
            className="btn-primary-zen px-4 py-2 text-xs"
          >Create project</Link>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
          {projects.slice(0, 6).map(p => (
            <button key={p.id} onClick={() => quickStart(p)}
              className="bento-card-hover relative flex flex-col gap-2.5 p-4 text-left group h-full min-h-[7rem]"
            >
              {/* Quick start icon */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-xl flex items-center justify-center
                              opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                <Play size={11} fill="currentColor" />
              </div>

              {/* Color + name */}
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || 'hsl(var(--primary))' }} />
                <span className="text-sm font-semibold text-foreground truncate leading-none">{p.name}</span>
              </div>

              {/* Status */}
              <span className={`tag self-start capitalize text-[11px] ${STATUS_STYLE[p.status] || STATUS_STYLE.ACTIVE}`}>
                {p.status?.toLowerCase().replace('_', ' ') || 'active'}
              </span>

              {/* Time tracked */}
              {(p.total_time ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground tabular-time mt-auto">{fmtHM(p.total_time!)}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
