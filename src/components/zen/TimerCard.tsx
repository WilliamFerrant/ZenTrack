'use client'

import { useCallback } from 'react'
import { Play, Pause, Square } from 'lucide-react'
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
    <div className="bento-card p-5 lg:p-6 flex flex-col items-center gap-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
      {/* Project chip row */}
      <div className="w-full flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Timer</p>
        {selectedProject && (
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            />
            {selectedProject.name}
            <span className="opacity-50 ml-0.5">×</span>
          </button>
        )}
      </div>

      {/* Ring + time */}
      <div className="relative">
        <CircularProgress percentage={percentage} size={200} strokeWidth={12} animate={isRunning} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-4xl font-light tabular-time text-foreground select-none">
            {formatTime(elapsedTime)}
          </p>
          <button
            onClick={toggleTimer}
            disabled={isStarting || isStopping}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-40 glow-primary-hover"
            style={{
              background: isRunning ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--primary))',
              color: isRunning ? 'hsl(var(--primary))' : 'hsl(var(--primary-foreground))',
            }}
          >
            {isRunning
              ? <Pause size={18} strokeWidth={2} />
              : <Play  size={18} strokeWidth={2} fill="currentColor" />
            }
          </button>
        </div>
      </div>

      {/* Task name input */}
      <input
        type="text"
        value={description}
        onChange={e => updateDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggleTimer() }}
        placeholder="What are you working on?"
        className="w-full bg-transparent text-center text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b pb-1 transition-colors"
        style={{ borderColor: 'hsl(0 0% 100% / 0.06)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'hsl(0 0% 100% / 0.06)')}
      />

      {/* Bottom row */}
      <div className="w-full flex items-center justify-between">
        {/* Project selector */}
        <div className="flex-1 min-w-0">
          {!selectedProject ? (
            <select
              value=""
              onChange={e => {
                const p = projects.find(x => String(x.id) === e.target.value)
                if (p) setSelectedProject(p)
              }}
              className="text-xs text-muted-foreground bg-transparent focus:outline-none cursor-pointer appearance-none truncate max-w-full"
            >
              <option value="" disabled>No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground truncate">{selectedProject.name}</span>
          )}
        </div>

        {/* End session */}
        {isRunning && (
          <button
            onClick={endSession}
            disabled={isStopping}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
          >
            <Square size={12} fill="currentColor" />
            End session
          </button>
        )}
      </div>
    </div>
  )
}
