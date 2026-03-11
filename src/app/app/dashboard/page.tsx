// Dashboard page
'use client'

import { useState, useEffect } from 'react'
import { useDataStore, useTimerStore, useFormattedElapsedTime } from '@/stores'
import { api } from '@/lib/api'

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtTime(sec: number): string {
  if (!sec) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function toDate(v: unknown): Date {
  return v instanceof Date ? v : new Date(String(v))
}

function isToday(v: unknown): boolean {
  const d = toDate(v), t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

function isThisWeek(v: unknown): boolean {
  const d = toDate(v)
  const s = new Date(); s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0)
  return d >= s
}

function isThisMonth(v: unknown): boolean {
  const d = toDate(v), t = new Date()
  return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

function fmtTimeOfDay(v: unknown): string {
  return toDate(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────
function DonutChart({ billable, total }: { billable: number; total: number }) {
  const r = 34, circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(billable / total, 1) : 0
  const dash = pct * circ
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="14" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#6366f1" strokeWidth="14"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="56" textAnchor="middle" fontSize="16" fontWeight="700" fill="white">
        {total > 0 ? `${Math.round(pct * 100)}%` : '—'}
      </text>
    </svg>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-8 h-4 rounded-full relative transition-colors ${on ? 'bg-indigo-600' : 'bg-gray-700'}`}>
      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${on ? 'left-4' : 'left-0.5'}`} />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [entryPeriod, setEntryPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today')
  const [weekSummary, setWeekSummary] = useState<any>(null)

  const {
    recentEntries, projects, dashboardSummary, isLoadingEntries,
    fetchRecentEntries, fetchProjects, fetchDashboardSummary,
  } = useDataStore()

  const {
    isRunning, isStarting, isStopping, currentTimer,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()

  const formattedElapsed = useFormattedElapsedTime()

  useEffect(() => {
    fetchRecentEntries(50)
    fetchProjects()
    fetchDashboardSummary('day')
    api.get<any>('/dashboard/summary?period=week').then(setWeekSummary).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // filtered entries
  const filteredEntries = recentEntries.filter(e => {
    if (entryPeriod === 'today') return isToday(e.start_time)
    if (entryPeriod === 'week')  return isThisWeek(e.start_time)
    if (entryPeriod === 'month') return isThisMonth(e.start_time)
    return true
  })

  const todaySec      = dashboardSummary?.totals?.total_time     ?? 0
  const billableSec   = dashboardSummary?.totals?.billable_time  ?? 0
  const totalEntries  = dashboardSummary?.totals?.total_entries  ?? 0
  const progressPct   = Math.min(Math.max((todaySec / (8 * 3600)) * 100, 0), 100)
  const handlePct     = Math.min(Math.max(progressPct, 1), 97)
  const weekTotal     = weekSummary?.totals?.total_time    ?? 0
  const weekBillable  = weekSummary?.totals?.billable_time ?? 0

  const handleStart = async () => {
    try {
      await startTimer({ project_id: selectedProject?.id, description: description.trim() || undefined })
    } catch (_) {}
  }

  const handleStop = async () => {
    try { await stopTimer() } catch (_) {}
  }

  return (
    <div className="space-y-4">
      {/* ── Row 1: two columns ── */}
      <div className="grid grid-cols-5 gap-4">

        {/* Left: time entries */}
        <div className="col-span-3 bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Time Entries</h2>
              <p className="text-xs text-gray-500 mt-0.5">{filteredEntries.length} entries</p>
            </div>
            <div className="flex gap-1">
              {(['today', 'week', 'month', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setEntryPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                    entryPeriod === p ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-52">
            {isLoadingEntries
              ? [...Array(3)].map((_, i) => <div key={i} className="h-11 bg-gray-800 rounded-lg animate-pulse" />)
              : filteredEntries.length === 0
              ? <p className="text-center text-gray-600 text-sm py-10">No entries for this period</p>
              : filteredEntries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (entry as any).project?.color || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{entry.description || (entry as any).project?.name || 'No description'}</p>
                    <p className="text-xs text-gray-500">{(entry as any).project?.name || '—'} · {fmtTimeOfDay(entry.start_time)}</p>
                  </div>
                  <span className="text-sm font-mono text-gray-300 flex-shrink-0 tabular-nums">{fmtTime(entry.duration)}</span>
                  {entry.is_billable && <span className="text-xs text-indigo-400 flex-shrink-0">$</span>}
                </div>
              ))
            }
          </div>
        </div>

        {/* Right: timer */}
        <div className="col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Timer</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isRunning ? `Running · ${currentTimer?.project?.name || 'No project'}` : 'Ready to start'}
              </p>
            </div>
            <a href="/app/tracking" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</a>
          </div>

          {/* Today progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Today&apos;s goal</span>
              <span className="font-mono">{fmtTime(todaySec)} / 8h</span>
            </div>
            <div className="relative h-1.5 bg-gray-800 rounded-full">
              <div className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-indigo-500 shadow" style={{ left: `calc(${handlePct}% - 6px)` }} />
            </div>
          </div>

          {/* Form fields */}
          <div className="flex-1 space-y-2.5">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Project</label>
              <div className="relative flex items-center">
                {selectedProject && (
                  <div className="absolute left-3 w-2 h-2 rounded-full z-10 pointer-events-none" style={{ backgroundColor: selectedProject.color || '#6366f1' }} />
                )}
                <select
                  value={selectedProject?.id ?? ''}
                  onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
                  className={`w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg py-2.5 pr-3 appearance-none focus:outline-none focus:border-indigo-500 ${selectedProject ? 'pl-7' : 'pl-3'}`}
                >
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => updateDescription(e.target.value)}
                placeholder="What are you working on?"
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {isRunning ? (
              <div className="flex gap-2 pt-1">
                <div className="flex-1 bg-green-950 border border-green-800 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-mono text-green-300 text-sm font-semibold">{formattedElapsed}</span>
                </div>
                <button onClick={handleStop} disabled={isStopping} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                  {isStopping ? '…' : 'Stop'}
                </button>
              </div>
            ) : (
              <button onClick={handleStart} disabled={isStarting} className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg py-2.5 disabled:opacity-50 transition-colors">
                {isStarting ? 'Starting…' : '▶  Start Timer'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: three cards ── */}
      <div className="grid grid-cols-4 gap-4">

        {/* Card 1: Today */}
        <div className="col-span-1 bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Today</h3>
            <Toggle on={isRunning} />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold text-white tracking-tight">{fmtTime(todaySec)}</p>
            <p className="text-xs text-gray-500 mt-1.5">{totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}</p>
            <p className="text-xs text-indigo-400 mt-0.5">{fmtTime(billableSec)} billable</p>
          </div>
          <button
            onClick={isRunning ? handleStop : handleStart}
            disabled={isStarting || isStopping}
            className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              isRunning ? 'bg-transparent border border-red-800 text-red-400 hover:bg-red-950' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isRunning ? 'Stop Timer' : 'Start Timer'}
          </button>
        </div>

        {/* Card 2: Weekly chart */}
        <div className="col-span-1 bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">This Week</h3>
            <Toggle on={false} />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <DonutChart billable={weekBillable} total={weekTotal} />
            <p className="mt-2 text-xs text-gray-400 font-mono">{fmtTime(weekTotal)} total</p>
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-gray-400">Billable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
              <span className="text-xs text-gray-400">Free</span>
            </div>
          </div>
        </div>

        {/* Card 3: Projects (wide) */}
        <div className="col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Projects</h3>
              <p className="text-xs text-gray-500">{projects.length} active</p>
            </div>
            <Toggle on={projects.length > 0} />
          </div>

          {projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-600 text-lg">+</div>
              <p className="text-sm text-gray-500">No projects yet</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-2">
              {projects.slice(0, 4).map(project => (
                <button
                  key={project.id}
                  onClick={() => { setSelectedProject(project); if (!isRunning) handleStart() }}
                  className="flex items-center gap-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-700 rounded-lg px-3 py-2.5 transition-colors text-left group"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">{project.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{project.status?.toLowerCase() || 'active'}</p>
                  </div>
                  <span className="text-indigo-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-1.5 mt-3 flex-wrap">
            {projects.map(p => (
              <div key={p.id} title={p.name} className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#6366f1' }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
