// Main timer widget
'use client'

import { useTimerStore, useFormattedElapsedTime } from '@/stores'
import { useDataStore } from '@/stores'
import { Play, Square, ChevronDown } from 'lucide-react'

function fmtHMS(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerCard() {
  const {
    isRunning, isStarting, isStopping, elapsedTime,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()
  const { projects } = useDataStore()
  const elapsed = useFormattedElapsedTime()

  const handleStart = async () => {
    try { await startTimer({ project_id: selectedProject?.id, description: description.trim() || undefined }) } catch {}
  }
  const handleStop = async () => {
    try { await stopTimer() } catch {}
  }

  const displayTime = isRunning ? elapsed : fmtHMS(0)

  return (
    <div className="bento-card h-full flex flex-col p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Timer</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRunning
              ? `Tracking · ${selectedProject?.name || 'No project'}`
              : 'Ready to track'}
          </p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
            Live
          </div>
        )}
      </div>

      {/* Big clock */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
        <div className="tabular-time font-bold tracking-tight select-none"
          style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', color: isRunning ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
          {displayTime}
        </div>
        {isRunning && selectedProject && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProject.color || 'hsl(var(--primary))' }} />
            {selectedProject.name}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Project */}
        <div className="relative">
          {selectedProject && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedProject.color || 'hsl(var(--primary))' }} />
          )}
          <select
            value={selectedProject?.id ?? ''}
            onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
            className="input-zen appearance-none pr-8"
            style={{ paddingLeft: selectedProject ? '2.25rem' : '0.75rem' }}
          >
            <option value="">Select project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={e => updateDescription(e.target.value)}
          placeholder="What are you working on?"
          className="input-zen"
          onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) handleStart() }}
        />

        {/* Start / Stop */}
        {isRunning ? (
          <button onClick={handleStop} disabled={isStopping}
            className="btn-primary-zen w-full py-3 text-sm glow-primary glow-primary-hover"
            style={{ background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
          >
            <Square size={15} fill="currentColor" />
            {isStopping ? 'Stopping…' : 'Stop Timer'}
          </button>
        ) : (
          <button onClick={handleStart} disabled={isStarting}
            className="btn-primary-zen w-full py-3 text-sm glow-primary glow-primary-hover"
          >
            <Play size={15} fill="currentColor" />
            {isStarting ? 'Starting…' : 'Start Timer'}
          </button>
        )}
      </div>
    </div>
  )
}
