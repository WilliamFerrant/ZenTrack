'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, FolderOpen, Plus, X, ChevronDown, Check } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'
import { api } from '@/lib/api'
import type { Client, Project } from '@/types'

function fmtHm(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

const MiniRing = ({ progress, color }: { progress: number; color?: string }) => {
  const size = 28
  const sw = 2.5
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const offset = c - (progress / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle stroke="currentColor" className="text-muted/15" strokeWidth={sw} fill="transparent" r={r} cx={size / 2} cy={size / 2} />
      <circle
        stroke={color || 'hsl(var(--primary))'}
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

const COLORS = ['#7EB8C4', '#7EC47E', '#C4A77E', '#C47E7E', '#A77EC4', '#7E9EC4', '#C4C47E', '#7EC4B8']

function ClientSelect({ clients, value, onChange }: { clients: Client[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = clients.find(c => String(c.id) === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-border/40 hover:border-border/70 text-sm transition-colors focus:outline-none focus:border-primary/50"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground/50'}>
          {selected ? selected.name : 'No client'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 w-full z-50 bento-card rounded-xl overflow-hidden shadow-xl border border-border/40 py-1">
          {[{ id: '', name: 'No client' }, ...clients].map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(String(c.id)); setOpen(false) }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-white/[0.06] transition-colors"
            >
              <span className={value === String(c.id) ? 'text-foreground' : 'text-muted-foreground'}>{c.name}</span>
              {value === String(c.id) && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AddProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [clientId, setClientId] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [isBillable, setIsBillable] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Client[]>('/clients').then(setClients).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = { name: name.trim(), color, is_billable: isBillable }
      if (clientId) body.client_id = Number(clientId)
      if (hourlyRate) body.hourly_rate = Number(hourlyRate)
      const project = await api.post<Project>('/projects', body)
      onCreated(project)
      onClose()
    } catch {
      setError('Failed to create project')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'hsl(0 0% 0% / 0.6)', backdropFilter: 'blur(4px)' }} />
      <div
        className="bento-card p-6 w-96 relative z-10 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">New project</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-b border-border focus:border-primary outline-none pb-2 transition-colors"
          />

          {/* Client */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] text-muted-foreground">Client</p>
            <ClientSelect clients={clients} value={clientId} onChange={setClientId} />
          </div>

          {/* Color */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-muted-foreground">Color</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full transition-all duration-150"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Billable + rate */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer flex-1">
              <button
                type="button"
                onClick={() => setIsBillable(v => !v)}
                className={`w-8 h-4 rounded-full transition-colors relative ${isBillable ? 'bg-primary' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isBillable ? 'left-4' : 'left-0.5'}`} />
              </button>
              <span className="text-xs text-muted-foreground">Billable</span>
            </label>
            {isBillable && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  placeholder="0.00/hr"
                  className="w-24 bg-white/[0.04] border border-border/40 rounded-xl px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {saving ? 'Creating…' : 'Create project'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects, fetchProjects } = useDataStore()
  const { isRunning, selectedProject, setSelectedProject, startTimer, elapsedTime, currentTimer } = useTimerStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const projectsWithLiveTime = projects.map(p => {
    if (isRunning && currentTimer && String(p.id) === String(currentTimer.project_id)) {
      return { ...p, total_time: (p.total_time ?? 0) + elapsedTime }
    }
    return p
  })

  const maxTime = projectsWithLiveTime.reduce((m, p) => Math.max(m, p.total_time ?? 0), 1)

  const quickStart = async (p: Project) => {
    setSelectedProject(p)
    setActiveId(String(p.id))
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <>
      <div className="bento-card p-4 animate-fade-in h-full flex flex-col" style={{ animationDelay: '250ms' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Projects</p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors text-muted-foreground hover:text-primary"
            style={{ background: 'hsl(var(--muted) / 0.1)' }}
          >
            <Plus size={11} />
            Add
          </button>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
          {isLoadingProjects ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-11 rounded-xl animate-pulse" style={{ background: 'hsl(var(--muted) / 0.1)' }} />
            ))
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <FolderOpen size={24} className="text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground/60">No projects yet</p>
            </div>
          ) : (
            projectsWithLiveTime.map((p, i) => {
              const isActive = activeId === String(p.id) || selectedProject?.id === p.id
              const progress = maxTime > 0 ? Math.round(((p.total_time ?? 0) / maxTime) * 100) : 0
              return (
                <div
                  key={p.id}
                  className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-200 ${isActive ? 'ring-1 ring-primary/20' : ''}`}
                  style={{ background: isActive ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted) / 0.06)' }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.12)' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.06)' }}
                >
                  <MiniRing progress={progress} color={p.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtHm(p.total_time ?? 0)} today</p>
                  </div>
                  <button
                    onClick={() => quickStart(p)}
                    className={`p-1.5 rounded-lg transition-all duration-200 active:scale-90 shrink-0 ${
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                    }`}
                    style={isActive ? {} : { background: 'hsl(var(--muted) / 0.1)' }}
                  >
                    <Play size={12} fill={isActive ? 'currentColor' : 'none'} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {showAdd && (
        <AddProjectModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { fetchProjects() }}
        />
      )}
    </>
  )
}
