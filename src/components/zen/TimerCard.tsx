'use client'

import { useCallback } from 'react'
import { useTimerStore, useDataStore } from '@/stores'

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  animate?: boolean
}

const CircularProgress = ({
  percentage,
  size = 200,
  strokeWidth = 12,
  animate = false,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        className="text-muted/15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-primary"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: animate
            ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: animate ? 'drop-shadow(0 0 8px hsl(166 28% 62% / 0.4))' : 'none',
        }}
      />
    </svg>
  )
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerCard() {
  const {
    isRunning, isStarting, isStopping, elapsedTime,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()
  const { projects } = useDataStore()

  const targetSeconds = 8 * 3600
  const percentage = Math.min((elapsedTime / targetSeconds) * 100, 100)

  const toggleTimer = useCallback(async () => {
    try {
      if (isRunning) {
        await stopTimer()
      } else {
        await startTimer({
          project_id: selectedProject?.id,
          description: description.trim() || undefined,
        })
      }
    } catch {}
  }, [isRunning, startTimer, stopTimer, selectedProject, description])

  const endSession = useCallback(async () => {
    try { await stopTimer() } catch {}
  }, [stopTimer])

  return (
    <div className="bento-card p-6 lg:p-8 flex flex-col items-center justify-center text-center gap-5 animate-fade-in h-full" style={{ animationDelay: '50ms' }}>

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Timer</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {isRunning ? 'Session active' : 'Ready to focus'}
        </p>
      </div>

      {/* Ring with large button inside */}
      <div className="relative">
        <CircularProgress percentage={percentage} size={200} strokeWidth={12} animate={isRunning} />
        {/* Clickable area fills the inside of the ring */}
        <button
          onClick={toggleTimer}
          disabled={isStarting || isStopping}
          className={`absolute inset-0 flex items-center justify-center rounded-full m-[18px] transition-all duration-300 disabled:opacity-40 ${
            isRunning ? 'bg-primary/8 hover:bg-primary/15' : 'bg-muted/8 hover:bg-primary/8'
          }`}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          <div
            className="bg-primary rounded-full p-5 text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95 glow-primary"
          >
            {isRunning ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Time — below ring */}
      <p className="tabular-time text-5xl lg:text-6xl font-extralight tracking-tighter text-foreground select-none">
        {formatTime(elapsedTime)}
      </p>

      {/* Task input */}
      <input
        type="text"
        value={description}
        onChange={e => updateDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggleTimer() }}
        placeholder="What are you working on?"
        className="bg-transparent text-base font-light text-center w-full max-w-xs focus:outline-none placeholder:text-muted-foreground/40 text-foreground border-b pb-2 transition-colors"
        style={{ borderColor: 'hsl(0 0% 100% / 0.5)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'hsl(0 0% 100% / 0.5)')}
      />

      {/* Project chip + end session */}
      <div className="flex items-center gap-3">
        {selectedProject ? (
          <button
            onClick={() => setSelectedProject(null)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedProject.color }} />
            {selectedProject.name}
          </button>
        ) : (
          <select
            value=""
            onChange={e => {
              const p = projects.find(x => String(x.id) === e.target.value)
              if (p) setSelectedProject(p)
            }}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full focus:outline-none cursor-pointer appearance-none"
            style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
          >
            <option value="" disabled>Select project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {isRunning && (
          <button
            onClick={endSession}
            disabled={isStopping}
            className="text-[11px] font-medium px-4 py-1.5 rounded-full transition-colors active:scale-95 disabled:opacity-40"
            style={{ background: 'hsl(var(--muted) / 0.15)', color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.25)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.15)'}
          >
            End Session
          </button>
        )}
      </div>
    </div>
  )
}
