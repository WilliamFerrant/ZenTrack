'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderOpen, DollarSign, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react'
import { useDataStore } from '@/stores'
import { api } from '@/lib/api'
import type { Client, Project } from '@/types'

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

const PALETTE = [
  '#5eead4', '#34d399', '#60a5fa', '#a78bfa', '#f472b6',
  '#fb923c', '#facc15', '#94a3b8',
]

function fmtHours(secs?: number) {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}

// Reusable custom select for clients
function ClientSelect({ clients, value, onChange }: { clients: Client[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = clients.find(c => String(c.id) === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-border/40 hover:border-border/70 text-sm transition-colors focus:outline-none focus:border-primary/50"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground/50'}>
          {selected ? selected.name : 'No client'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full z-50 bento-card rounded-xl overflow-hidden shadow-xl border border-border/40 py-1">
          {[{ id: '', name: 'No client' }, ...clients].map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(String(c.id)); setOpen(false) }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-white/[0.06] transition-colors"
            >
              <span className={value === String(c.id) ? 'text-foreground' : 'text-muted-foreground'}>{c.name}</span>
              {value === String(c.id) && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Reusable custom select for status
function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-border/40 hover:border-border/70 text-sm transition-colors focus:outline-none"
      >
        <span className="text-foreground">{STATUS_LABELS[value] ?? value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 w-full z-50 bento-card rounded-xl overflow-hidden shadow-xl border border-border/40 py-1">
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => { onChange(k); setOpen(false) }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-white/[0.06] transition-colors"
            >
              <span className={value === k ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
              {value === k && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface EditForm {
  name: string
  description: string
  color: string
  is_billable: boolean
  hourly_rate: string
  client_id: string
  status: string
}

interface NewProjectForm {
  name: string
  description: string
  color: string
  is_billable: boolean
  hourly_rate: string
}

export default function ProjectsPage() {
  const { projects, isLoadingProjects, fetchProjects, createProject, showToast } = useDataStore()
  const router = useRouter()

  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [clients, setClients]       = useState<Client[]>([])
  const [form, setForm] = useState<NewProjectForm>({
    name: '', description: '', color: PALETTE[0], is_billable: true, hourly_rate: '',
  })

  // Edit state
  const [editProject, setEditProject]   = useState<Project | null>(null)
  const [editForm, setEditForm]         = useState<EditForm | null>(null)
  const [editSaving, setEditSaving]     = useState(false)

  // Delete state
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [deleting, setDeleting]           = useState(false)

  useEffect(() => {
    fetchProjects()
    api.get<Client[]>('/clients').then(setClients).catch(() => {})
  }, []) // eslint-disable-line

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

  const openEdit = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation()
    setEditForm({
      name: p.name,
      description: (p as any).description ?? '',
      color: p.color,
      is_billable: p.is_billable,
      hourly_rate: p.hourly_rate ? String(p.hourly_rate) : '',
      client_id: p.client_id ? String(p.client_id) : '',
      status: p.status,
    })
    setEditProject(p)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm || !editProject) return
    setEditSaving(true)
    try {
      await api.put(`/projects/${editProject.id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        color: editForm.color,
        is_billable: editForm.is_billable,
        hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : null,
        client_id: editForm.client_id ? parseInt(editForm.client_id) : null,
        status: editForm.status,
      })
      await fetchProjects()
      setEditProject(null)
      showToast({ type: 'success', title: 'Project updated' })
    } catch {
      showToast({ type: 'error', title: 'Failed to update project' })
    }
    setEditSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteProject) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${deleteProject.id}`)
      await fetchProjects()
      setDeleteProject(null)
      showToast({ type: 'success', title: 'Project deleted' })
    } catch {
      showToast({ type: 'error', title: 'Failed to delete project' })
    }
    setDeleting(false)
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
          <form onSubmit={handleCreate} className="bento-card p-5 rounded-2xl space-y-4">
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Color</span>
                <div className="flex gap-1.5">
                  {PALETTE.map(c => (
                    <button
                      key={c} type="button" onClick={() => upd('color', c)}
                      className={`w-5 h-5 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-1 ring-offset-background scale-125' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => upd('is_billable', !form.is_billable)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  form.is_billable ? 'border-primary/50 text-primary bg-primary/10' : 'border-border/60 text-muted-foreground hover:border-primary/30'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                Billable
              </button>

              {form.is_billable && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">$</span>
                  <input
                    type="number" min="0" step="0.01" placeholder="Hourly rate"
                    className="bg-background/50 text-sm text-foreground border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary outline-none w-28"
                    value={form.hourly_rate}
                    onChange={e => upd('hourly_rate', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                type="submit" disabled={saving || !form.name.trim()}
                className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {isLoadingProjects && (
          <div className="py-16 text-center text-muted-foreground text-sm">Loading projects…</div>
        )}

        {/* Active projects */}
        {!isLoadingProjects && activeProjects.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Active</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeProjects.map(p => (
                <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={e => { e.stopPropagation(); setDeleteProject(p) }} />
              ))}
            </div>
          </div>
        )}

        {/* Inactive projects */}
        {!isLoadingProjects && inactiveProjects.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">Other</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inactiveProjects.map(p => (
                <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={e => { e.stopPropagation(); setDeleteProject(p) }} />
              ))}
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

      {/* Edit modal */}
      {editProject && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditProject(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bento-card p-6 w-full max-w-md rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">Edit project</h2>
              <button onClick={() => setEditProject(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Name</label>
                <input
                  className="form-input"
                  value={editForm.name}
                  onChange={e => setEditForm(f => f && ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Description</label>
                <input
                  className="form-input"
                  value={editForm.description}
                  onChange={e => setEditForm(f => f && ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Client</label>
                <ClientSelect clients={clients} value={editForm.client_id} onChange={v => setEditForm(f => f && ({ ...f, client_id: v }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Status</label>
                <StatusSelect value={editForm.status} onChange={v => setEditForm(f => f && ({ ...f, status: v }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setEditForm(f => f && ({ ...f, color: c }))}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        boxShadow: editForm.color === c ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}` : 'none',
                        transform: editForm.color === c ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditForm(f => f && ({ ...f, is_billable: !f.is_billable }))}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    editForm.is_billable ? 'border-primary/50 text-primary bg-primary/10' : 'border-border/60 text-muted-foreground'
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  Billable
                </button>
                {editForm.is_billable && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">$</span>
                    <input
                      type="number" min="0" step="0.01"
                      className="form-input w-28"
                      placeholder="0.00/hr"
                      value={editForm.hourly_rate}
                      onChange={e => setEditForm(f => f && ({ ...f, hourly_rate: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditProject(null)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving || !editForm.name.trim()} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteProject(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bento-card p-6 w-full max-w-sm rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-foreground mb-2">Delete project?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="text-foreground font-medium">"{deleteProject.name}"</span> will be archived and removed from the list. Time entries are preserved.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteProject(null)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 text-sm py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project
  onEdit: (e: React.MouseEvent, p: Project) => void
  onDelete: (e: React.MouseEvent, p: Project) => void
}) {
  const router = useRouter()
  return (
    <div
      onClick={() => router.push(`/app/projects/${project.id}`)}
      className="bento-card bento-card-hover p-4 flex flex-col gap-3 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: project.color }} />
          <span className="text-sm font-medium text-foreground truncate">{project.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Action buttons — visible on hover */}
          <button
            onClick={e => onEdit(e, project)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => onDelete(e, project)}
            className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] ?? STATUS_COLORS.ACTIVE}`}>
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{(project as any).description}</p>
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
