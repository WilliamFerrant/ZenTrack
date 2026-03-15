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
          transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
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

export default function TimerCard({ compact = false }: { compact?: boolean }) {
  const {
    isRunning, isStarting, isStopping, elapsedTime,
    currentTimer, selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer, pauseTimer, resumeTimer,
  } = useTimerStore()
  const isPaused = currentTimer?.is_paused ?? false
  const { projects } = useDataStore()

  const targetSeconds = 8 * 3600
  const percentage = Math.min((elapsedTime / targetSeconds) * 100, 100)

  const toggleTimer = useCallback(async () => {
    try {
      if (isRunning && !isPaused) {
        await pauseTimer()
      } else if (isRunning && isPaused) {
        await resumeTimer()
      } else {
        await startTimer({
          project_id: selectedProject?.id,
          description: description.trim() || undefined,
        })
      }
    } catch {}
  }, [isRunning, isPaused, startTimer, pauseTimer, resumeTimer, selectedProject, description])

  const endSession = useCallback(async () => {
    try { await stopTimer() } catch {}
  }, [stopTimer])

  const ringSize = compact ? 140 : 200
  const ringStroke = compact ? 9 : 12
  const btnInset = compact ? 'm-[13px]' : 'm-[18px]'
  const iconSize = compact ? 22 : 32
  const btnPad = compact ? 'p-3' : 'p-5'

  return (
    <div className={`bento-card flex flex-col items-center justify-center text-center animate-fade-in h-full ${compact ? 'gap-2 p-4' : 'gap-5 p-6 lg:p-8'}`} style={{ animationDelay: '50ms' }}>

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Timer</p>
        {!compact && (
          <p className={`text-[10px] mt-1 ${isPaused ? 'text-yellow-400/80' : 'text-muted-foreground/60'}`}>
            {isPaused ? 'Paused' : isRunning ? 'Session active' : 'Ready to focus'}
          </p>
        )}
      </div>

      {/* Ring with large button inside */}
      <div className="relative">
        <CircularProgress percentage={percentage} size={ringSize} strokeWidth={ringStroke} animate={isRunning} />
        <button
          onClick={toggleTimer}
          disabled={isStarting || isStopping}
          className={`absolute inset-0 flex items-center justify-center rounded-full ${btnInset} transition-all duration-300 disabled:opacity-40 ${
            isRunning ? 'bg-primary/8 hover:bg-primary/15' : 'bg-muted/8 hover:bg-primary/8'
          }`}
          aria-label={isRunning && !isPaused ? 'Pause timer' : isPaused ? 'Resume timer' : 'Start timer'}
        >
          <div className={`rounded-full ${btnPad} text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95 glow-primary ${isPaused ? 'bg-yellow-500/80' : 'bg-primary'}`}>
            {isRunning && !isPaused ? (
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Time — below ring */}
      <p className={`tabular-time font-extralight tracking-tighter text-foreground select-none ${compact ? 'text-3xl' : 'text-5xl lg:text-6xl'}`}>
        {formatTime(elapsedTime)}
      </p>

      {/* Task input */}
      <input
        type="text"
        value={description}
        onChange={e => updateDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggleTimer() }}
        placeholder="What are you working on?"
        className="bg-transparent text-sm font-light text-center w-full focus:outline-none placeholder:text-muted-foreground/40 text-foreground border-b pb-1.5 transition-colors"
        style={{ borderColor: 'hsl(0 0% 100% / 0.5)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'hsl(0 0% 100% / 0.5)')}
      />

      {/* Project chip + end session */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
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
            className="text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors active:scale-95 disabled:opacity-40"
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
