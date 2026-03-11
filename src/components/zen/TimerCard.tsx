'use client'

import { useTimerStore, useDataStore } from '@/stores'
import { Play, Square, ChevronDown } from 'lucide-react'

// H:MM:SS — no leading zero on hours
function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function CircleRing({
  isRunning, pct, onToggle, isLoading,
}: {
  isRunning: boolean; pct: number; onToggle: () => void; isLoading: boolean
}) {
  const r = 100, cx = 120, cy = 120
  const circ = 2 * Math.PI * r   // ≈ 628.3

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: 240, height: 240 }}>
      {/* SVG — track + progress arcs */}
      <svg width="240" height="240" viewBox="0 0 240 240" className="absolute inset-0">
        {/* Outer subtle ring */}
        <circle cx={cx} cy={cy} r={r + 14} fill="none"
          stroke="hsl(var(--muted) / 0.08)" strokeWidth="1" />
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="hsl(var(--muted) / 0.22)" strokeWidth="12" />
        {/* Inner body */}
        <circle cx={cx} cy={cy} r="82" fill="hsl(var(--card))" />
        {/* Progress arc */}
        {pct > 0.002 && (
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="hsl(var(--primary))" strokeWidth="12"
            strokeDasharray={`${pct * circ} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        )}
        {/* Glow dot at tip when running */}
        {isRunning && pct > 0.01 && (() => {
          const angle = -Math.PI / 2 + pct * 2 * Math.PI
          const tx = cx + r * Math.cos(angle)
          const ty = cy + r * Math.sin(angle)
          return <circle cx={tx} cy={ty} r="5" fill="hsl(var(--primary))" opacity="0.8" />
        })()}
      </svg>

      {/* Centered play/stop button */}
      <button
        onClick={onToggle}
        disabled={isLoading}
        className="relative z-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40"
        style={{
          width: 72, height: 72,
          background: isRunning
            ? 'hsl(var(--destructive) / 0.15)'
            : 'hsl(var(--primary) / 0.14)',
          border: `1.5px solid ${isRunning ? 'hsl(var(--destructive) / 0.35)' : 'hsl(var(--primary) / 0.35)'}`,
          color: isRunning ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
          boxShadow: isRunning
            ? '0 0 32px hsl(var(--destructive) / 0.12)'
            : '0 0 32px hsl(var(--glow) / 0.18)',
        }}
      >
        {isRunning
          ? <Square size={24} strokeWidth={2} />
          : <Play size={26} fill="currentColor" strokeWidth={0} style={{ marginLeft: 4 }} />
        }
      </button>
    </div>
  )
}

export default function TimerCard() {
  const {
    isRunning, isStarting, isStopping, elapsedTime,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()
  const { projects } = useDataStore()

  const toggle = async () => {
    try {
      isRunning
        ? await stopTimer()
        : await startTimer({ project_id: selectedProject?.id, description: description.trim() || undefined })
    } catch {}
  }

  // Arc fills based on elapsed vs 8h goal
  const pct = Math.min(elapsedTime / (8 * 3600), 1)

  return (
    <div className="bento-card h-full flex flex-col p-6 gap-3">
      {/* Status header */}
      <div className="text-center pb-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
          {isRunning ? 'Live Timer' : 'Timer'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRunning ? (selectedProject?.name || 'Tracking…') : 'Ready to track'}
        </p>
      </div>

      {/* Circle ring */}
      <CircleRing
        isRunning={isRunning}
        pct={pct}
        onToggle={toggle}
        isLoading={isStarting || isStopping}
      />

      {/* Big clock */}
      <div className="text-center -mt-1">
        <p className="tabular-time font-bold text-foreground leading-none select-none"
          style={{ fontSize: 'clamp(3.5rem, 7vw, 6rem)' }}>
          {fmtClock(elapsedTime)}
        </p>
      </div>

      {/* Description — underline style */}
      <div className="relative mt-1">
        <input
          type="text"
          value={description}
          onChange={e => updateDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full bg-transparent border-0 border-b pb-2 text-center text-sm
                     text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
          style={{
            borderColor: 'hsl(var(--border))',
            caretColor: 'hsl(var(--primary))',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
          onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggle() }}
        />
      </div>

      {/* Project selector */}
      <div className="flex justify-center mt-1">
        {selectedProject ? (
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProject.color }} />
            {selectedProject.name}
            <span className="opacity-60 ml-0.5">×</span>
          </button>
        ) : (
          <div className="relative">
            <select
              value=""
              onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
              className="bg-transparent text-center text-xs text-muted-foreground focus:outline-none
                         appearance-none pr-4 cursor-pointer"
            >
              <option value="" disabled>Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}
