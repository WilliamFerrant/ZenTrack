'use client'

import { useDataStore, useTimerStore } from '@/stores'
import { FolderOpen, Play } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types'

function fmtHM(sec: number) {
  if (!sec) return '0h 00m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function ProjectArc({ color, pct }: { color: string; pct: number }) {
  const r = 15
  const circ = 2 * Math.PI * r  // ≈ 94.25
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
      <circle cx="20" cy="20" r={r} fill="none"
        stroke="hsl(var(--muted) / 0.28)" strokeWidth="3.5" />
      {pct > 0.01 && (
        <circle cx="20" cy="20" r={r} fill="none"
          stroke={color || 'hsl(var(--primary))'} strokeWidth="3.5"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      )}
    </svg>
  )
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, setSelectedProject, startTimer } = useTimerStore()

  const maxTime = Math.max(...projects.map(p => p.total_time ?? 0), 1)

  const quickStart = async (p: Project) => {
    setSelectedProject(p)
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <div className="bento-card h-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
          Projects
        </p>
        <Link href="/app/projects"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all →
        </Link>
      </div>

      {isLoadingProjects ? (
        <div className="flex-1 grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse"
              style={{ background: 'hsl(var(--muted) / 0.2)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'hsl(var(--muted) / 0.4)' }}>
            <FolderOpen size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Link href="/app/projects" className="btn-primary-zen px-4 py-2 text-xs">
            Create project
          </Link>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-0 content-start">
          {projects.slice(0, 6).map((p, i) => {
            const pct = (p.total_time ?? 0) / maxTime
            const isLast = i >= projects.slice(0, 6).length - 3
            return (
              <div key={p.id}
                className="flex items-center gap-3 py-2.5 group"
                style={{ borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))' }}
              >
                <ProjectArc color={p.color || 'hsl(var(--primary))'} pct={pct} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-none">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-time mt-0.5">
                    {fmtHM(p.total_time ?? 0)}
                  </p>
                </div>
                <button onClick={() => quickStart(p)}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                             opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                  style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                >
                  <Play size={10} fill="currentColor" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
