'use client'

import { useEffect, useState } from 'react'
import { Plus, FolderOpen, Pencil, DollarSign, ExternalLink, Circle } from 'lucide-react'
import { useDataStore } from '@/stores'
import type { Project } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'text-primary bg-primary/10 border-primary/20',
  ON_HOLD: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  COMPLETED: 'text-muted-foreground bg-white/5 border-border/40',
  ARCHIVED: 'text-muted-foreground/50 bg-white/[0.03] border-border/20',
}

function fmtHours(secs?: number) {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}

interface NewProjectForm {
  name: string
  description: string
  color: string
  is_billable: boolean
  hourly_rate: string
}

const PALETTE = [
  '#5eead4', '#34d399', '#60a5fa', '#a78bfa', '#f472b6',
  '#fb923c', '#facc15', '#94a3b8',
]

export default function ProjectsPage() {
  const { projects, isLoadingProjects, fetchProjects, createProject } = useDataStore()

  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState<NewProjectForm>({
    name: '', description: '', color: PALETTE[0], is_billable: true, hourly_rate: '',
  })

  useEffect(() => { fetchProjects() }, []) // eslint-disable-line

  const upd = (k: keyof NewProjectForm, v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await createProject({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
        is_billable: form.is_billable,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
        status: 'ACTIVE',
      })
      setShowForm(false)
      setForm({ name: '', description: '', color: PALETTE[0], is_billable: true, hourly_rate: '' })
    } catch { /* toast shown by store */ }
    setSaving(false)
  }

  const activeProjects   = projects.filter(p => p.status === 'ACTIVE')
  const inactiveProjects = projects.filter(p => p.status !== 'ACTIVE')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 glow-primary transition-all"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bento-sage p-5 rounded-2xl space-y-4">
            <h2 className="text-sm font-medium text-foreground">New project</h2>

            <input
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-b border-border focus:border-primary outline-none pb-1"
              placeholder="Project name *"
              value={form.name}
              onChange={e => upd('name', e.target.value)}
              required
              autoFocus
            />
            <input
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-b border-border focus:border-primary outline-none pb-1"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => upd('description', e.target.value)}
            />

            <div className="flex flex-wrap items-center gap-4">
              {/* Color picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Color</span>
                <div className="flex gap-1.5">
                  {PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => upd('color', c)}
                      className={`w-5 h-5 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-1 ring-offset-background scale-125' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Billable */}
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
                    placeholder="Hourly rate"
                    className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary outline-none w-28"
                    value={form.hourly_rate}
                    onChange={e => upd('hourly_rate', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {isLoadingProjects && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Loading projects…
          </div>
        )}

        {/* Active projects */}
        {!isLoadingProjects && activeProjects.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Active
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        )}

        {/* Inactive projects */}
        {!isLoadingProjects && inactiveProjects.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Other
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inactiveProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        )}

        {/* Empty */}
        {!isLoadingProjects && projects.length === 0 && (
          <div className="bento-card py-20 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-foreground/70 font-medium mb-1">No projects yet</p>
            <p className="text-sm text-muted-foreground">Create your first project to start tracking time</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 flex items-center gap-2 mx-auto px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bento-card bento-card-hover p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            style={{ backgroundColor: project.color }}
          />
          <span className="text-sm font-medium text-foreground truncate">{project.name}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLORS[project.status] ?? STATUS_COLORS.ACTIVE}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center gap-3 mt-auto pt-1 text-xs text-muted-foreground">
        {project.is_billable && (
          <span className="flex items-center gap-1 text-primary/70">
            <DollarSign className="w-3 h-3" />
            {project.hourly_rate ? `$${project.hourly_rate}/hr` : 'Billable'}
          </span>
        )}
        {project.total_time != null && project.total_time > 0 && (
          <span>{Math.floor(project.total_time / 3600)}h tracked</span>
        )}
        {project.active_tasks_count != null && (
          <span>{project.active_tasks_count} task{project.active_tasks_count !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}
