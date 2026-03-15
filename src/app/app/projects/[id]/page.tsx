'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Check, Trash2, X, Circle, Clock,
  AlertCircle, ChevronDown, DollarSign,
} from 'lucide-react'
import { useDataStore } from '@/stores'
import { api } from '@/lib/api'
import type { Project, Task, TaskStatus, TaskPriority } from '@/types'

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

function fmtHours(secs?: number) {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
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
      showToast({ type: 'success', title: 'Task deleted' })
    } catch {
      showToast({ type: 'error', title: 'Failed to delete task' })
    }
    setDeletingId(null)
  }

  const activeTasks    = tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')
  const completedTasks = tasks.filter(t => t.status === 'DONE' || t.status === 'CANCELLED')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/app/projects')}
            className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {project ? (
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
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
              <button
                type="button"
                onClick={() => { setShowAddInput(false); setNewTaskName('') }}
                className="px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}

          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="bento-card py-12 text-center">
              <Check className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            </div>
          ) : (
            <>
              {/* Active tasks */}
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

              {/* Completed tasks */}
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

  const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']
  const isDone = task.status === 'DONE' || task.status === 'CANCELLED'

  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors ${borderTop ? 'border-t border-border/30' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowStatusMenu(false) }}
    >
      {/* Status button */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowStatusMenu(v => !v)}
          className="flex items-center justify-center w-5 h-5"
          title="Change status"
        >
          {STATUS_ICON[task.status as TaskStatus] ?? STATUS_ICON.TODO}
        </button>
        {showStatusMenu && (
          <div className="absolute left-0 top-6 z-20 bento-card p-1 shadow-xl min-w-[130px]">
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
