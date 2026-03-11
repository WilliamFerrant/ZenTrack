'use client'

import { useState } from 'react'
import { Play, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useDataStore, useTimerStore } from '@/stores'
import type { Project } from '@/types'

function fmtHm(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

const MiniRing = ({ progress }: { progress: number }) => {
  const size = 32
  const sw = 2.5
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const offset = c - (progress / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        className="text-muted/15"
        stroke="currentColor"
        strokeWidth={sw}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-primary"
        stroke="currentColor"
        strokeWidth={sw}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  )
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, selectedProject, setSelectedProject, startTimer } = useTimerStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const maxTime = projects.reduce((m, p) => Math.max(m, p.total_time ?? 0), 1)

  const quickStart = async (p: Project) => {
    setSelectedProject(p)
    setActiveId(String(p.id))
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <div className="bento-card p-5 lg:p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Projects</p>

      {isLoadingProjects ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted) / 0.1)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <FolderOpen size={28} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No projects yet</p>
          <Link
            href="/app/projects"
            className="text-xs px-4 py-2 rounded-full font-medium transition-opacity hover:opacity-80"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p, i) => {
            const isActive = activeId === String(p.id) || selectedProject?.id === p.id
            const progress = maxTime > 0 ? Math.round(((p.total_time ?? 0) / maxTime) * 100) : 0
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-200 group ${
                  isActive
                    ? 'ring-1 ring-primary/20'
                    : ''
                }`}
                style={{
                  background: isActive
                    ? 'hsl(var(--primary) / 0.1)'
                    : 'hsl(var(--muted) / 0.06)',
                  animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.12)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.06)'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MiniRing progress={progress} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtHm(p.total_time ?? 0)} today</p>
                  </div>
                </div>
                <button
                  onClick={() => quickStart(p)}
                  className={`p-2 rounded-xl transition-all duration-200 active:scale-90 shrink-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground glow-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                  style={isActive ? {} : { background: 'hsl(var(--muted) / 0.1)' }}
                  aria-label={`Start ${p.name} timer`}
                >
                  <Play size={14} fill={isActive ? 'currentColor' : 'none'} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
