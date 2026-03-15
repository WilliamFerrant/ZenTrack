'use client'

import { useEffect, useState, useCallback } from 'react'
import { Clock, Search, Trash2, Pencil, DollarSign, ChevronDown, Download } from 'lucide-react'
import { useDataStore } from '@/stores'
import type { TimeEntry, Project } from '@/types'
import { api } from '@/lib/api'

function exportToCSV(entries: TimeEntry[], projects: Project[]) {
  const rows: string[][] = [
    ['Date', 'Start', 'End', 'Duration (h)', 'Description', 'Project', 'Billable'],
  ]
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmtDate = (dt: string | Date) => {
    const d = new Date(dt)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  const fmtTime = (dt: string | Date) => {
    const d = new Date(dt)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const fmtDur = (secs: number) => (secs / 3600).toFixed(2)

  entries
    .slice()
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .forEach(e => {
      const proj = projects.find(p => p.id === e.project_id)
      rows.push([
        fmtDate(e.start_time),
        fmtTime(e.start_time),
        fmtTime(e.end_time),
        fmtDur(e.duration || 0),
        e.description ?? '',
        proj?.name ?? '',
        e.is_billable ? 'Yes' : 'No',
      ])
    })

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `time-entries-${fmtDate(new Date())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function fmtDuration(secs: number) {
  if (!secs || secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtTime(dt: string | Date) {
  return new Date(dt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function groupByDate(entries: TimeEntry[]): { key: string; label: string; entries: TimeEntry[]; totalSecs: number }[] {
  const map: Record<string, TimeEntry[]> = {}
  entries.forEach(e => {
    const k = toDateKey(new Date(e.start_time))
    if (!map[k]) map[k] = []
    map[k].push(e)
  })
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, entries]) => {
      const d = new Date(key + 'T00:00:00')
      const today = toDateKey(new Date())
      const yesterday = toDateKey(new Date(Date.now() - 86400000))
      let label: string
      if (key === today) label = 'Today'
      else if (key === yesterday) label = 'Yesterday'
      else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      return {
        key,
        label,
        entries: entries.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()),
        totalSecs: entries.reduce((s, e) => s + (e.duration || 0), 0),
      }
    })
}

export default function HistoryPage() {
  const { projects, fetchProjects, deleteTimeEntry, updateTimeEntry } = useDataStore()

  const [entries, setEntries]     = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch]       = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId]   = useState<string | null>(null)

  // date range: last 30 days default
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return toDateKey(d)
  })
  const [endDate, setEndDate] = useState(() => toDateKey(new Date()))

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const resp = await api.get<any>(
        `/time-entries?start_date=${startDate}&end_date=${endDate}&limit=500`
      )
      setEntries(Array.isArray(resp) ? resp : (resp?.entries ?? []))
    } catch { setEntries([]) }
    setIsLoading(false)
  }, [startDate, endDate])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (!projects.length) fetchProjects() }, []) // eslint-disable-line

  const filtered = entries.filter(e => {
    if (projectFilter && e.project_id !== projectFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const desc = e.description?.toLowerCase() ?? ''
      const proj = projects.find(p => p.id === e.project_id)?.name?.toLowerCase() ?? ''
      if (!desc.includes(q) && !proj.includes(q)) return false
    }
    return true
  })

  const groups = groupByDate(filtered)

  const handleDelete = async (id: string) => {
    await deleteTimeEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const handleDuplicate = async (entry: TimeEntry) => {
    // not implemented — placeholder for future
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'} · {fmtDuration(filtered.reduce((s, e) => s + (e.duration || 0), 0))} total
            </p>
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() => exportToCSV(filtered, projects)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border/40 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.07] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              className="w-full bg-white/[0.04] border border-border/40 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              placeholder="Search entries…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Project filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white/[0.04] border border-border/40 rounded-xl px-3 pr-7 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
            >
              <option value="">All projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Date range */}
          <input
            type="date"
            className="bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <span className="self-center text-muted-foreground text-xs">–</span>
          <input
            type="date"
            className="bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">Loading entries…</div>
        ) : groups.length === 0 ? (
          <div className="bento-card py-20 text-center">
            <Clock className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-foreground/60 text-sm">No entries found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.key} className="space-y-1">
                {/* Day header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-foreground/80">{group.label}</span>
                  <span className="text-xs tabular-time text-muted-foreground">{fmtDuration(group.totalSecs)}</span>
                </div>

                <div className="bento-card overflow-hidden">
                  {group.entries.map((entry, idx) => {
                    const project = projects.find(p => p.id === entry.project_id)
                    return (
                      <HistoryRow
                        key={entry.id}
                        entry={entry}
                        project={project}
                        borderTop={idx > 0}
                        isEditing={editingId === entry.id}
                        isSaving={savingId === entry.id}
                        onEdit={() => setEditingId(editingId === entry.id ? null : entry.id)}
                        onDelete={() => handleDelete(entry.id)}
                        onSave={async (desc, projectId, isBillable) => {
                          setSavingId(entry.id)
                          try {
                            const updated = await updateTimeEntry(entry.id, {
                              description: desc || undefined,
                              project_id: projectId || undefined,
                              is_billable: isBillable,
                            })
                            setEntries(prev => prev.map(e => e.id === entry.id ? updated : e))
                            setEditingId(null)
                          } catch {}
                          setSavingId(null)
                        }}
                        projects={projects}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryRow({
  entry, project, borderTop, isEditing, isSaving, onEdit, onDelete, onSave, projects,
}: {
  entry: TimeEntry
  project: Project | undefined
  borderTop: boolean
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onDelete: () => void
  onSave: (desc: string, projectId: string, isBillable: boolean) => Promise<void>
  projects: Project[]
}) {
  const [hovered, setHovered] = useState(false)
  const [desc, setDesc]       = useState(entry.description ?? '')
  const [projId, setProjId]   = useState(entry.project_id ?? '')
  const [billable, setBillable] = useState(entry.is_billable)

  if (isEditing) {
    return (
      <div className={`px-4 py-3 space-y-2 ${borderTop ? 'border-t border-border/30' : ''}`}>
        <div className="flex gap-2 flex-wrap">
          <input
            className="flex-1 min-w-36 bg-transparent text-sm text-foreground border-b border-border focus:border-primary outline-none pb-1"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description"
            autoFocus
          />
          <select
            className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2 py-1 focus:border-primary outline-none"
            value={projId}
            onChange={e => setProjId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setBillable(v => !v)}
            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
              billable
                ? 'border-primary/40 text-primary bg-primary/10'
                : 'border-border/50 text-muted-foreground'
            }`}
          >
            <DollarSign className="w-3 h-3" />
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-white/5">Cancel</button>
          <button
            disabled={isSaving}
            onClick={() => onSave(desc, projId, billable)}
            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${borderTop ? 'border-t border-border/30' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: project?.color ?? 'hsl(var(--muted-foreground))' }}
      />
      <span className="flex-1 text-sm truncate">
        {entry.description
          ? <span className="text-foreground">{entry.description}</span>
          : <span className="text-muted-foreground italic">No description</span>
        }
      </span>
      {project && (
        <span
          className="text-xs px-2 py-0.5 rounded-full border hidden sm:inline flex-shrink-0"
          style={{ borderColor: `${project.color}50`, color: project.color }}
        >
          {project.name}
        </span>
      )}
      {entry.is_billable && (
        <DollarSign className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
      )}
      <span className="text-xs text-muted-foreground flex-shrink-0 hidden md:inline tabular-nums">
        {fmtTime(entry.start_time)} – {fmtTime(entry.end_time)}
      </span>
      <span className="text-sm font-medium tabular-time flex-shrink-0 w-14 text-right">
        {fmtDuration(entry.duration)}
      </span>
      <div className={`flex gap-1 flex-shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={onEdit} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-muted-foreground hover:text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
