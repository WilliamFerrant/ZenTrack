'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause } from 'lucide-react'
import { useTimerStore, useDataStore } from '@/stores'

function pad(n: number) { return String(n).padStart(2, '0') }
function splitTime(sec: number) {
  return {
    h: pad(Math.floor(sec / 3600)),
    m: pad(Math.floor((sec % 3600) / 60)),
    s: pad(sec % 60),
  }
}

const circumference = 2 * Math.PI * 45   // r = 45, viewBox 0 0 100 100

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

  const progress  = Math.min((elapsedTime / (8 * 3600)) * 100, 100)
  const { h, m, s } = splitTime(elapsedTime)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="glass-card p-6 lg:p-8 flex flex-col items-center justify-center gap-0"
    >
      {/* Progress ring */}
      <div className="relative w-56 h-56 lg:w-72 lg:h-72">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r="45" fill="none"
            stroke="hsl(var(--muted) / 0.15)" strokeWidth="4" />
          {/* Progress */}
          <motion.circle cx="50" cy="50" r="45" fill="none"
            stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))' }}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${(progress / 100) * circumference} ${circumference}` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        {/* Center button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={toggle}
            disabled={isStarting || isStopping}
            className="bg-card/80 rounded-full w-20 h-20 lg:w-28 lg:h-28 flex items-center justify-center shadow-lg transition-colors hover:bg-card disabled:opacity-50"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isRunning ? 'pause' : 'play'}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
              >
                {isRunning
                  ? <Pause size={40} className="text-primary" />
                  : <Play  size={40} className="text-primary" fill="currentColor" />
                }
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Task name — underline input */}
      <input
        type="text"
        value={description}
        onChange={e => updateDescription(e.target.value)}
        placeholder="What are you working on?"
        onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggle() }}
        className="bg-transparent text-center text-lg lg:text-xl font-medium mt-6 w-full max-w-sm focus:outline-none border-b border-transparent text-foreground placeholder:text-muted-foreground transition-colors pb-1"
        style={{ borderBottomColor: 'hsl(var(--border) / 0.1)' }}
        onFocus={e => (e.currentTarget.style.borderBottomColor = 'hsl(var(--primary) / 0.3)')}
        onBlur={e => (e.currentTarget.style.borderBottomColor = 'hsl(var(--border) / 0.1)')}
      />

      {/* Clock */}
      <div className="text-5xl lg:text-6xl font-light tabular-nums mt-3 text-foreground tracking-tight select-none">
        <span>{h}</span>
        <span className="text-muted-foreground">:</span>
        <span>{m}</span>
        <span className="text-muted-foreground">:</span>
        <span>{s}</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4 mt-5">
        {selectedProject ? (
          <button onClick={() => setSelectedProject(null)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors hover:opacity-80"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProject.color }} />
              {selectedProject.name}
              <span className="opacity-50">×</span>
            </span>
          </button>
        ) : (
          <select
            value=""
            onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
            className="text-xs bg-transparent text-muted-foreground focus:outline-none cursor-pointer appearance-none"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.375rem 0.75rem', borderRadius: 9999 }}
          >
            <option value="" disabled>Select project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {isRunning && (
          <button onClick={toggle} disabled={isStopping}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
            End Session
          </button>
        )}
      </div>
    </motion.div>
  )
}
