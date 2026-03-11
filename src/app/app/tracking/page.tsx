'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Plus,
  DollarSign,
  Pencil,
  Trash2,
  Clock,
  Timer as TimerIcon,
} from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import { useTimerStore } from '@/stores/timerStore'
import type { TimeEntry, Project } from '@/types'
import { api } from '@/lib/api'

// ─── Date utilities ────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekEnd(date: Date): Date {
  const s = getWeekStart(date)
  const e = new Date(s)
  e.setDate(s.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yr = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yr.getTime()) / 86400000 + 1) / 7)
}

function getDaysOfWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDuration(secs: number): string {
  if (!secs || secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtTime(dt: string | Date): string {
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function fmtElapsed(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function toTimeVal(dt: string | Date): string {
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

interface EntryFormState {
  description: string
  project_id: string
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  is_billable: boolean
  hourly_rate: string
}

function defaultForm(day: Date, projectId = ''): EntryFormState {
  const now = new Date()
  const end = toTimeVal(now)
  const start = toTimeVal(new Date(now.getTime() - 3600000))
  return {
    description: '',
    project_id: projectId,
    date: toDateKey(day),
    start_time: start,
    end_time: end,
    is_billable: true,
    hourly_rate: '',
  }
}

function formToPayload(form: EntryFormState) {
  const [sy, sm, sd] = form.date.split('-').map(Number)
  const [sh, smin] = form.start_time.split(':').map(Number)
  const [eh, emin] = form.end_time.split(':').map(Number)
  const startDt = new Date(sy, sm - 1, sd, sh, smin, 0)
  const endDt = new Date(sy, sm - 1, sd, eh, emin, 0)
  return {
    description: form.description || undefined,
    project_id: form.project_id || undefined,
    start_time: startDt.toISOString(),
    end_time: endDt.toISOString(),
    is_billable: form.is_billable,
    hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
  }
}

// ─── EntryForm component ──────────────────────────────────────────────────────

function EntryForm({
  initial,
  projects,
  onSave,
  onCancel,
  saving,
}: {
  initial: EntryFormState
  projects: Project[]
  onSave: (form: EntryFormState) => Promise<void>
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<EntryFormState>(initial)
  const upd = (field: keyof EntryFormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const startDt = new Date(`${form.date}T${form.start_time}`)
  const endDt = new Date(`${form.date}T${form.end_time}`)
  const previewSecs =
    endDt > startDt
      ? Math.round((endDt.getTime() - startDt.getTime()) / 1000)
      : 0

  return (
    <div className="bento-sage p-4 rounded-xl space-y-3">
      <input
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-b border-border focus:border-primary outline-none pb-1"
        placeholder="What did you work on?"
        value={form.description}
        onChange={e => upd('description', e.target.value)}
        autoFocus
      />

      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary outline-none"
          value={form.project_id}
          onChange={e => upd('project_id', e.target.value)}
        >
          <option value="">No project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary outline-none"
          value={form.date}
          onChange={e => upd('date', e.target.value)}
        />

        <div className="flex items-center gap-1">
          <input
            type="time"
            className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary outline-none w-[6.5rem]"
            value={form.start_time}
            onChange={e => upd('start_time', e.target.value)}
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="time"
            className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary outline-none w-[6.5rem]"
            value={form.end_time}
            onChange={e => upd('end_time', e.target.value)}
          />
        </div>

        {previewSecs > 0 && (
          <span className="text-xs text-muted-foreground tabular-time">
            {fmtDuration(previewSecs)}
          </span>
        )}

        <button
          type="button"
          onClick={() => upd('is_billable', !form.is_billable)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
            form.is_billable
              ? 'border-primary/50 text-primary bg-primary/10'
              : 'border-border/60 text-muted-foreground hover:border-primary/30'
          }`}
        >
          <DollarSign className="w-3 h-3" />
          Billable
        </button>

        {form.is_billable && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-xs">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Rate/hr"
              className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary outline-none w-24"
              value={form.hourly_rate}
              onChange={e => upd('hourly_rate', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || previewSecs <= 0}
          onClick={() => onSave(form)}
          className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </div>
  )
}

// ─── EntryRow component ───────────────────────────────────────────────────────

function EntryRow({
  entry,
  project,
  borderTop,
  onEdit,
  onDelete,
}: {
  entry: TimeEntry
  project: Project | undefined
  borderTop: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${borderTop ? 'border-t border-border/30' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: project?.color || 'hsl(var(--muted-foreground))' }}
      />

      <span className="flex-1 text-sm truncate">
        {entry.description ? (
          <span className="text-foreground">{entry.description}</span>
        ) : (
          <span className="text-muted-foreground italic">No description</span>
        )}
      </span>

      {project && (
        <span
          className="text-xs px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:inline"
          style={{ borderColor: `${project.color}50`, color: project.color }}
        >
          {project.name}
        </span>
      )}

      {entry.is_billable && (
        <DollarSign className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
      )}

      <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums hidden md:inline">
        {fmtTime(entry.start_time)} – {fmtTime(entry.end_time)}
      </span>

      <span className="text-sm font-medium tabular-time flex-shrink-0 w-14 text-right">
        {fmtDuration(entry.duration)}
      </span>

      <div
        className={`flex gap-1 flex-shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
      >
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const [weekRef, setWeekRef] = useState(new Date())
  const weekStart = useMemo(() => getWeekStart(weekRef), [weekRef])
  const weekEnd   = useMemo(() => getWeekEnd(weekRef),   [weekRef])
  const days      = useMemo(() => getDaysOfWeek(weekStart), [weekStart])
  const weekNum   = useMemo(() => getISOWeek(weekStart), [weekStart])

  const [entries, setEntries]       = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading]   = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [savingId, setSavingId]     = useState<string | null>(null)
  const [addingForDay, setAddingForDay] = useState<string | null>(null)
  const [savingNew, setSavingNew]   = useState(false)

  const { projects, fetchProjects, createTimeEntry, updateTimeEntry, deleteTimeEntry } =
    useDataStore()

  const {
    isRunning,
    elapsedTime,
    selectedProject,
    description: timerDesc,
    startTimer,
    stopTimer,
    setSelectedProject,
    updateDescription,
    isStarting,
    isStopping,
  } = useTimerStore()

  // ── Load week entries ──────────────────────────────────────────────────────
  const loadWeekEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      const s = toDateKey(weekStart)
      const e = toDateKey(weekEnd)
      const resp = await api.get<any>(
        `/time-entries?start_date=${s}&end_date=${e}&limit=500`
      )
      setEntries(Array.isArray(resp) ? resp : (resp?.entries ?? []))
    } catch {
      setEntries([])
    }
    setIsLoading(false)
  }, [weekStart, weekEnd])

  useEffect(() => { loadWeekEntries() }, [loadWeekEntries])
  useEffect(() => { if (!projects.length) fetchProjects() }, []) // eslint-disable-line

  // ── Derived data ───────────────────────────────────────────────────────────
  const groupedEntries = useMemo(() => {
    const map: Record<string, TimeEntry[]> = {}
    days.forEach(d => { map[toDateKey(d)] = [] })
    entries.forEach(e => {
      const key = toDateKey(new Date(e.start_time))
      if (map[key]) map[key].push(e)
      else map[key] = [e]
    })
    return map
  }, [entries, days])

  const daySeconds = useMemo(() => {
    const map: Record<string, number> = {}
    days.forEach(d => {
      const k = toDateKey(d)
      map[k] = (groupedEntries[k] ?? []).reduce((s, e) => s + (e.duration || 0), 0)
    })
    return map
  }, [groupedEntries, days])

  const weekSeconds = useMemo(
    () => Object.values(daySeconds).reduce((a, b) => a + b, 0),
    [daySeconds]
  )

  const maxDaySeconds = useMemo(
    () => Math.max(...Object.values(daySeconds), 1),
    [daySeconds]
  )

  const isCurrentWeek = sameDay(getWeekStart(new Date()), weekStart)

  // ── Mutations ─────────────────────────────────────────────────────────────
  const handleCreate = async (form: EntryFormState) => {
    setSavingNew(true)
    try {
      const entry = await createTimeEntry(formToPayload(form))
      setEntries(prev => [...prev, entry])
      setAddingForDay(null)
    } catch { /* toast shown by store */ }
    setSavingNew(false)
  }

  const handleUpdate = async (id: string, form: EntryFormState) => {
    setSavingId(id)
    try {
      const updated = await updateTimeEntry(id, formToPayload(form))
      setEntries(prev => prev.map(e => e.id === id ? updated : e))
      setEditingId(null)
    } catch { /* toast shown by store */ }
    setSavingId(null)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTimeEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch { /* toast shown by store */ }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Timer Bar ────────────────────────────────────────────────── */}
        <div className="bento-card p-4 flex items-center gap-3 flex-wrap">
          <input
            className="flex-1 min-w-48 bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-b border-border focus:border-primary outline-none pb-1"
            placeholder="What are you working on?"
            value={timerDesc}
            onChange={e => updateDescription(e.target.value)}
          />

          <select
            className="bg-background/50 text-sm text-foreground border border-border/60 rounded-xl px-3 py-2 focus:border-primary outline-none"
            value={selectedProject?.id || ''}
            onChange={e =>
              setSelectedProject(projects.find(p => p.id === e.target.value) ?? null)
            }
          >
            <option value="">No project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {isRunning && (
            <span className="text-primary tabular-time text-base font-light">
              {fmtElapsed(elapsedTime)}
            </span>
          )}

          <button
            onClick={() => isRunning ? stopTimer() : startTimer()}
            disabled={isStarting || isStopping}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
              isRunning
                ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-primary'
            }`}
          >
            {isRunning ? (
              <><Square className="w-4 h-4 fill-current" /> Stop</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Start</>
            )}
          </button>
        </div>

        {/* ── Week Navigation ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setWeekRef(d => {
                  const n = new Date(d)
                  n.setDate(n.getDate() - 7)
                  return n
                })
              }
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-foreground">
                {isCurrentWeek ? 'This Week' : 'Week'} · W{weekNum}
              </span>
              <span className="text-xs text-muted-foreground">
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <button
              onClick={() =>
                setWeekRef(d => {
                  const n = new Date(d)
                  n.setDate(n.getDate() + 7)
                  return n
                })
              }
              disabled={isCurrentWeek}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentWeek && (
              <button
                onClick={() => setWeekRef(new Date())}
                className="text-xs px-2.5 py-1 rounded-lg border border-border/60 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="tabular-time font-medium">{fmtDuration(weekSeconds)}</span>
            <span className="text-muted-foreground text-xs">this week</span>
          </div>
        </div>

        {/* ── Week Bar Chart ────────────────────────────────────────────── */}
        <div className="bento-card p-4">
          <div className="grid grid-cols-7 gap-3">
            {days.map(day => {
              const key     = toDateKey(day)
              const secs    = daySeconds[key] ?? 0
              const isTd    = sameDay(day, new Date())
              const heightPct = secs > 0 ? Math.max((secs / maxDaySeconds) * 100, 8) : 0

              return (
                <div key={key} className="flex flex-col items-center gap-1">
                  <span className={`text-xs ${isTd ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className={`text-sm font-medium ${isTd ? 'text-primary' : 'text-foreground'}`}>
                    {day.getDate()}
                  </span>
                  <div className="h-10 w-full bg-white/5 rounded-md overflow-hidden flex items-end">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${isTd ? 'bg-primary/60' : 'bg-white/20'}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-xs tabular-time ${secs > 0 ? (isTd ? 'text-primary' : 'text-foreground') : 'text-muted-foreground/30'}`}>
                    {fmtDuration(secs)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Day Sections ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <TimerIcon className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading entries…</span>
          </div>
        ) : (
          <>
            {days.map(day => {
              const key        = toDateKey(day)
              const dayEntries = (groupedEntries[key] ?? [])
                .slice()
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              const dayTotal   = daySeconds[key] ?? 0
              const isTd       = sameDay(day, new Date())
              const isAddingHere = addingForDay === key

              // Skip empty non-today days
              if (dayEntries.length === 0 && !isTd && !isAddingHere) return null

              const dayLabel = isTd
                ? `Today · ${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
                : day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

              return (
                <div key={key} className="space-y-2">
                  {/* Day header */}
                  <div className="flex items-center justify-between px-1">
                    <span className={`text-sm font-medium ${isTd ? 'text-primary' : 'text-foreground/80'}`}>
                      {dayLabel}
                    </span>
                    <div className="flex items-center gap-3">
                      {dayTotal > 0 && (
                        <span className="text-xs tabular-time text-muted-foreground">
                          {fmtDuration(dayTotal)}
                        </span>
                      )}
                      <button
                        onClick={() => setAddingForDay(isAddingHere ? null : key)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-border/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add entry
                      </button>
                    </div>
                  </div>

                  {/* Entry list */}
                  {dayEntries.length > 0 && (
                    <div className="bento-card overflow-hidden">
                      {dayEntries.map((entry, idx) => {
                        const project = projects.find(p => p.id === entry.project_id)
                        if (editingId === entry.id) {
                          return (
                            <div
                              key={entry.id}
                              className={idx > 0 ? 'border-t border-border/30 p-3' : 'p-3'}
                            >
                              <EntryForm
                                initial={{
                                  description: entry.description || '',
                                  project_id:  entry.project_id  || '',
                                  date:        toDateKey(new Date(entry.start_time)),
                                  start_time:  toTimeVal(entry.start_time),
                                  end_time:    toTimeVal(entry.end_time),
                                  is_billable: entry.is_billable,
                                  hourly_rate: entry.hourly_rate ? String(entry.hourly_rate) : '',
                                }}
                                projects={projects}
                                onSave={form => handleUpdate(entry.id, form)}
                                onCancel={() => setEditingId(null)}
                                saving={savingId === entry.id}
                              />
                            </div>
                          )
                        }
                        return (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            project={project}
                            borderTop={idx > 0}
                            onEdit={() => setEditingId(entry.id)}
                            onDelete={() => handleDelete(entry.id)}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Today empty state */}
                  {dayEntries.length === 0 && !isAddingHere && isTd && (
                    <div className="bento-card py-6 text-center text-sm text-muted-foreground">
                      No entries today — start the timer or add one manually
                    </div>
                  )}

                  {/* Add form */}
                  {isAddingHere && (
                    <EntryForm
                      initial={defaultForm(day, selectedProject?.id)}
                      projects={projects}
                      onSave={handleCreate}
                      onCancel={() => setAddingForDay(null)}
                      saving={savingNew}
                    />
                  )}
                </div>
              )
            })}

            {/* Empty past/future week */}
            {weekSeconds === 0 && !isCurrentWeek && !isLoading && (
              <div className="bento-card py-16 text-center">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">No time entries for this week</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}


