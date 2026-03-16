'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Check, Trash2, X, Circle, Clock,
  AlertCircle, ChevronDown, DollarSign, Pencil, FileText, Building2,
} from 'lucide-react'
import { useDataStore } from '@/stores'
import { api } from '@/lib/api'
import type { Project, Task, TaskStatus, TaskPriority, Client } from '@/types'

const STATUS_ICON: Record<TaskStatus, React.ReactNode> = {
  TODO:        <Circle className="w-4 h-4 text-muted-foreground/50" />,
  IN_PROGRESS: <Clock className="w-4 h-4 text-blue-400" />,
  DONE:        <Check className="w-4 h-4 text-primary" />,
  CANCELLED:   <X className="w-4 h-4 text-muted-foreground/30" />,
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  LOW:    'text-muted-foreground/50',
  MEDIUM: 'text-yellow-400/70',
  HIGH:   'text-orange-400',
  URGENT: 'text-red-400',
}

const PALETTE = ['#5eead4','#34d399','#60a5fa','#a78bfa','#f472b6','#fb923c','#facc15','#94a3b8']

function fmtHours(secs?: number) {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
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

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { projects, fetchProjects, showToast } = useDataStore()

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTaskName, setNewTaskName] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Edit project
  const [showEdit, setShowEdit] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)

  const project = projects.find(p => p.id === id)

  useEffect(() => {
    if (!projects.length) fetchProjects()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    api.get<Task[]>(`/projects/${id}/tasks`)
      .then(setTasks)
      .catch(() => showToast({ type: 'error', title: 'Failed to load tasks' }))
      .finally(() => setIsLoading(false))
  }, [id]) // eslint-disable-line

  const openEdit = () => {
    if (!project) return
    api.get<Client[]>('/clients').then(setClients).catch(() => {})
    setEditForm({
      name: project.name,
      description: (project as any).description ?? '',
      color: project.color,
      is_billable: project.is_billable,
      hourly_rate: project.hourly_rate ? String(project.hourly_rate) : '',
      client_id: project.client_id ? String(project.client_id) : '',
      status: project.status,
    })
    setShowEdit(true)
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm || !project) return
    setSaving(true)
    try {
      await api.put(`/projects/${id}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        color: editForm.color,
        is_billable: editForm.is_billable,
        hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : null,
        client_id: editForm.client_id ? parseInt(editForm.client_id) : null,
        status: editForm.status,
      })
      await fetchProjects()
      setShowEdit(false)
      showToast({ type: 'success', title: 'Project updated' })
    } catch {
      showToast({ type: 'error', title: 'Failed to update project' })
    }
    setSaving(false)
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskName.trim()) return
    setAddingTask(true)
    try {
      const task = await api.post<Task>(`/projects/${id}/tasks`, {
        name: newTaskName.trim(),
        project_id: parseInt(id),
        status: 'TODO',
        priority: 'MEDIUM',
        is_billable: project?.is_billable ?? true,
      })
      setTasks(prev => [...prev, task])
      setNewTaskName('')
      setShowAddInput(false)
      showToast({ type: 'success', title: 'Task created' })
    } catch {
      showToast({ type: 'error', title: 'Failed to create task' })
    }
    setAddingTask(false)
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    try {
      const updated = await api.put<Task>(`/projects/${id}/tasks/${task.id}`, { status })
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch {
      showToast({ type: 'error', title: 'Failed to update task' })
    }
  }

  async function handleDelete(taskId: string) {
    setDeletingId(taskId)
    try {
      await api.delete(`/projects/${id}/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch {
      showToast({ type: 'error', title: 'Failed to delete task' })
    }
    setDeletingId(null)
  }

  const activeTasks    = tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')
  const completedTasks = tasks.filter(t => t.status === 'DONE' || t.status === 'CANCELLED')

  const client = project?.client_id
    ? clients.find(c => String(c.id) === String(project.client_id))
    : null

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back + header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/app/projects')}
              className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {project ? (
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
                {project.is_billable && (
                  <span className="text-xs text-primary/70 flex items-center gap-0.5">
                    <DollarSign className="w-3 h-3" />
                    {project.hourly_rate ? `$${project.hourly_rate}/hr` : 'Billable'}
                  </span>
                )}
              </div>
            ) : (
              <h1 className="text-xl font-semibold text-foreground">Project</h1>
            )}
          </div>

          {project && (
            <div className="flex items-center gap-2">
              {/* Invoice button */}
              <button
                onClick={() => router.push(`/app/invoice?project_id=${project.id}${project.client_id ? `&client_id=${project.client_id}` : ''}`)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border/40 bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Invoice
              </button>
              {/* Edit button */}
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border/40 bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Client badge */}
        {project?.client_id && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span>Client: <span className="text-foreground">{(project as any).client?.name ?? `#${project.client_id}`}</span></span>
          </div>
        )}

        {/* Tasks section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground/80">
              Tasks <span className="text-muted-foreground font-normal">({activeTasks.length} active)</span>
            </h2>
            <button
              onClick={() => setShowAddInput(v => !v)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add task
            </button>
          </div>

          {/* Add task input */}
          {showAddInput && (
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                autoFocus
                className="flex-1 bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                placeholder="Task name…"
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
              />
              <button
                type="submit"
                disabled={addingTask || !newTaskName.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {addingTask ? '…' : 'Add'}
              </button>
            </form>
          )}

          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : tasks.length === 0 ? (
            <div className="bento-card py-12 text-center">
              <Check className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            </div>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <div className="bento-card overflow-hidden">
                  {activeTasks.map((task, idx) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      borderTop={idx > 0}
                      isDeleting={deletingId === task.id}
                      onStatusChange={s => handleStatusChange(task, s)}
                      onDelete={() => handleDelete(task.id)}
                    />
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none flex items-center gap-1 px-1 py-1">
                    <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                    {completedTasks.length} completed
                  </summary>
                  <div className="bento-card overflow-hidden mt-2 opacity-60">
                    {completedTasks.map((task, idx) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        borderTop={idx > 0}
                        isDeleting={deletingId === task.id}
                        onStatusChange={s => handleStatusChange(task, s)}
                        onDelete={() => handleDelete(task.id)}
                      />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit project modal */}
      {showEdit && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <form
            className="relative bento-card p-6 w-full max-w-md rounded-2xl shadow-xl space-y-4"
            onClick={e => e.stopPropagation()}
            onSubmit={handleSaveProject}
          >
            <h2 className="text-base font-semibold text-foreground">Edit project</h2>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Name</label>
              <input
                className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                value={editForm.name}
                onChange={e => setEditForm(p => p && ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Description</label>
              <input
                className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                placeholder="Optional"
                value={editForm.description}
                onChange={e => setEditForm(p => p && ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Client */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Client</label>
              <select
                className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                value={editForm.client_id}
                onChange={e => setEditForm(p => p && ({ ...p, client_id: e.target.value }))}
              >
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                className="w-full bg-white/[0.04] border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                value={editForm.status}
                onChange={e => setEditForm(p => p && ({ ...p, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setEditForm(p => p && ({ ...p, color: c }))}
                    className={`w-6 h-6 rounded-full transition-all ${editForm.color === c ? 'ring-2 ring-offset-1 ring-offset-background scale-125' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Billable + rate */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditForm(p => p && ({ ...p, is_billable: !p.is_billable }))}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  editForm.is_billable
                    ? 'border-primary/50 text-primary bg-primary/10'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                <DollarSign className="w-3 h-3" />
                Billable
              </button>
              {editForm.is_billable && (
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    type="number" min="0" step="0.01" placeholder="Hourly rate"
                    className="flex-1 bg-white/[0.04] border border-border/40 rounded-xl px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    value={editForm.hourly_rate}
                    onChange={e => setEditForm(p => p && ({ ...p, hourly_rate: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowEdit(false)} className="flex-1 text-sm py-2 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving || !editForm.name.trim()} className="flex-1 text-sm py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, borderTop, isDeleting, onStatusChange, onDelete }: {
  task: Task
  borderTop: boolean
  isDeleting: boolean
  onStatusChange: (s: TaskStatus) => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']
  const isDone = task.status === 'DONE' || task.status === 'CANCELLED'

  const handleStatusBtn = (e: React.MouseEvent) => {
    e.stopPropagation()
    const r = btnRef.current!.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 4, left: r.left })
    setShowStatusMenu(v => !v)
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${borderTop ? 'border-t border-border/30' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Status button */}
      <div className="flex-shrink-0">
        <button
          ref={btnRef}
          onClick={handleStatusBtn}
          className="flex items-center justify-center w-5 h-5"
          title="Change status"
        >
          {STATUS_ICON[task.status as TaskStatus] ?? STATUS_ICON.TODO}
        </button>
        {showStatusMenu && typeof document !== 'undefined' && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowStatusMenu(false)} />
            <div
              className="fixed z-[9999] bento-card p-1 shadow-xl min-w-[130px]"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(s); setShowStatusMenu(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 transition-colors text-left ${task.status === s ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {STATUS_ICON[s]}
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
      </div>

      {/* Name */}
      <span className={`flex-1 text-sm truncate ${isDone ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
        {task.name}
      </span>

      {/* Priority indicator */}
      {task.priority && task.priority !== 'MEDIUM' && (
        <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 ${PRIORITY_COLOR[task.priority as TaskPriority] ?? ''}`} />
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className={`p-1.5 rounded-lg transition-all text-muted-foreground hover:text-red-400 hover:bg-red-400/10 flex-shrink-0 ${hovered ? 'opacity-100' : 'opacity-0'}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
