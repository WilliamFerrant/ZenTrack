// Data store using Zustand - manages projects, time entries, and dashboard data
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { api } from '../lib/api'
import type {
  Project,
  TimeEntry,
  DashboardSummary,
  PaginatedResponse,
  TimeEntryFilters,
  DataState,
  Toast,
  Modal,
  Task
} from '../types'

interface DataStore extends DataState {
  // Time entries actions
  fetchRecentEntries: (limit?: number) => Promise<void>
  fetchTimeEntries: (filters?: TimeEntryFilters) => Promise<PaginatedResponse<TimeEntry>>
  createTimeEntry: (entry: any) => Promise<TimeEntry>
  updateTimeEntry: (id: string, updates: any) => Promise<TimeEntry>
  deleteTimeEntry: (id: string) => Promise<void>

  // Projects actions
  fetchProjects: () => Promise<void>
  createProject: (project: any) => Promise<Project>
  updateProject: (id: string, updates: any) => Promise<Project>

  // Tasks actions
  fetchTasks: (projectId?: string) => Promise<Task[]>

  // Dashboard actions
  fetchDashboardSummary: (period?: 'day' | 'week' | 'month') => Promise<void>
  setDashboardPeriod: (period: 'day' | 'week' | 'month') => void

  // Global refresh
  refreshData: () => Promise<void>

  // UI actions
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
  showModal: (modal: Omit<Modal, 'id'>) => void
  hideModal: (id: string) => void
  setSidebarOpen: (open: boolean) => void

  // Error handling
  clearError: () => void
}

export const useDataStore = create<DataStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      recentEntries: [],
      isLoadingEntries: false,

      projects: [],
      isLoadingProjects: false,

      dashboardSummary: null,
      isLoadingDashboard: false,
      dashboardPeriod: 'day',

      toasts: [],
      modals: [],
      sidebarOpen: false,

      error: null,

      // Time entries actions
      fetchRecentEntries: async (limit = 10) => {
        try {
          set({ isLoadingEntries: true, error: null })

          const response = await api.get<{ entries: TimeEntry[] } | TimeEntry[]>(`/time-entries?limit=${limit}&sort=-created_at`)
          const entries = Array.isArray(response) ? response : (response as any).entries ?? []

          set({
            recentEntries: entries,
            isLoadingEntries: false,
          })
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to fetch recent entries'
          set({
            isLoadingEntries: false,
            error: errorMessage,
          })
          get().showToast({
            type: 'error',
            title: 'Failed to load recent entries',
            description: errorMessage,
          })
        }
      },

      fetchTimeEntries: async (filters: TimeEntryFilters = {}) => {
        try {
          const queryParams = new URLSearchParams()

          if (filters.start_date) {
            queryParams.append('start_date', filters.start_date.toISOString())
          }
          if (filters.end_date) {
            queryParams.append('end_date', filters.end_date.toISOString())
          }
          if (filters.project_ids?.length) {
            filters.project_ids.forEach(id => queryParams.append('project_ids', id))
          }
          if (filters.is_billable !== undefined) {
            queryParams.append('is_billable', filters.is_billable.toString())
          }
          if (filters.page) {
            queryParams.append('page', filters.page.toString())
          }
          if (filters.per_page) {
            queryParams.append('per_page', filters.per_page.toString())
          }

          const response = await api.get<PaginatedResponse<TimeEntry>>(
            `/time-entries?${queryParams.toString()}`
          )

          return response
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to fetch time entries'
          get().showToast({
            type: 'error',
            title: 'Failed to load time entries',
            description: errorMessage,
          })
          throw error
        }
      },

      createTimeEntry: async (entry: any) => {
        try {
          const newEntry = await api.post<TimeEntry>('/time-entries', entry)

          // Add to recent entries if it's recent
          const recentEntries = get().recentEntries
          set({
            recentEntries: [newEntry, ...recentEntries].slice(0, 10)
          })

          get().showToast({
            type: 'success',
            title: 'Time entry created',
            description: 'Your time entry has been saved successfully.',
          })

          return newEntry
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to create time entry'
          get().showToast({
            type: 'error',
            title: 'Failed to create entry',
            description: errorMessage,
          })
          throw error
        }
      },

      updateTimeEntry: async (id: string, updates: any) => {
        try {
          const updatedEntry = await api.put<TimeEntry>(`/time-entries/${id}`, updates)

          // Update in recent entries if present
          const recentEntries = get().recentEntries
          const index = recentEntries.findIndex(entry => entry.id === id)
          if (index !== -1) {
            const newEntries = [...recentEntries]
            newEntries[index] = updatedEntry
            set({ recentEntries: newEntries })
          }

          get().showToast({
            type: 'success',
            title: 'Time entry updated',
            description: 'Your changes have been saved successfully.',
          })

          return updatedEntry
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to update time entry'
          get().showToast({
            type: 'error',
            title: 'Failed to update entry',
            description: errorMessage,
          })
          throw error
        }
      },

      deleteTimeEntry: async (id: string) => {
        try {
          await api.delete(`/time-entries/${id}`)

          // Remove from recent entries
          const recentEntries = get().recentEntries.filter(entry => entry.id !== id)
          set({ recentEntries })

          get().showToast({
            type: 'success',
            title: 'Time entry deleted',
            description: 'The time entry has been removed.',
          })
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to delete time entry'
          get().showToast({
            type: 'error',
            title: 'Failed to delete entry',
            description: errorMessage,
          })
          throw error
        }
      },

      // Projects actions
      fetchProjects: async () => {
        try {
          set({ isLoadingProjects: true, error: null })

          const projects = await api.get<Project[]>('/projects?status=ACTIVE')

          set({
            projects,
            isLoadingProjects: false,
          })
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to fetch projects'
          set({
            isLoadingProjects: false,
            error: errorMessage,
          })
          get().showToast({
            type: 'error',
            title: 'Failed to load projects',
            description: errorMessage,
          })
        }
      },

      createProject: async (project: any) => {
        try {
          const newProject = await api.post<Project>('/projects', project)

          // Add to projects list
          const projects = get().projects
          set({ projects: [...projects, newProject] })

          get().showToast({
            type: 'success',
            title: 'Project created',
            description: `Project "${newProject.name}" has been created.`,
          })

          return newProject
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to create project'
          get().showToast({
            type: 'error',
            title: 'Failed to create project',
            description: errorMessage,
          })
          throw error
        }
      },

      updateProject: async (id: string, updates: any) => {
        try {
          const updatedProject = await api.put<Project>(`/projects/${id}`, updates)

          // Update in projects list
          const projects = get().projects
          const index = projects.findIndex(project => project.id === id)
          if (index !== -1) {
            const newProjects = [...projects]
            newProjects[index] = updatedProject
            set({ projects: newProjects })
          }

          get().showToast({
            type: 'success',
            title: 'Project updated',
            description: 'Project settings have been saved.',
          })

          return updatedProject
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to update project'
          get().showToast({
            type: 'error',
            title: 'Failed to update project',
            description: errorMessage,
          })
          throw error
        }
      },

      // Tasks actions
      fetchTasks: async (projectId?: string) => {
        try {
          const endpoint = projectId
            ? `/projects/${projectId}/tasks`
            : '/tasks?status=TODO,IN_PROGRESS'

          const tasks = await api.get<Task[]>(endpoint)
          return tasks
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to fetch tasks'
          get().showToast({
            type: 'error',
            title: 'Failed to load tasks',
            description: errorMessage,
          })
          throw error
        }
      },

      // Dashboard actions
      fetchDashboardSummary: async (period: 'day' | 'week' | 'month' = 'day') => {
        try {
          set({ isLoadingDashboard: true, error: null })

          const summary = await api.get<DashboardSummary>(
            `/dashboard/summary?period=${period}`
          )

          set({
            dashboardSummary: summary,
            dashboardPeriod: period,
            isLoadingDashboard: false,
          })
        } catch (error: any) {
          const errorMessage = error.data?.detail || 'Failed to fetch dashboard data'
          set({
            isLoadingDashboard: false,
            error: errorMessage,
          })
          get().showToast({
            type: 'error',
            title: 'Failed to load dashboard',
            description: errorMessage,
          })
        }
      },

      setDashboardPeriod: (period: 'day' | 'week' | 'month') => {
        set({ dashboardPeriod: period })
        get().fetchDashboardSummary(period)
      },

      // Global refresh
      refreshData: async () => {
        try {
          await Promise.all([
            get().fetchRecentEntries(),
            get().fetchProjects(),
            get().fetchDashboardSummary(get().dashboardPeriod),
          ])
        } catch (error) {
          // Individual errors are handled by each function
          console.error('Failed to refresh all data:', error)
        }
      },

      // UI actions
      showToast: (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(7)
        const newToast: Toast = { ...toast, id }

        set(state => ({
          toasts: [...state.toasts, newToast]
        }))

        // Auto-remove toast after duration
        const duration = toast.duration || 5000
        setTimeout(() => {
          get().hideToast(id)
        }, duration)
      },

      hideToast: (id: string) => {
        set(state => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
      },

      showModal: (modal: Omit<Modal, 'id'>) => {
        const id = Math.random().toString(36).substring(7)
        const newModal: Modal = { ...modal, id }

        set(state => ({
          modals: [...state.modals, newModal]
        }))
      },

      hideModal: (id: string) => {
        set(state => ({
          modals: state.modals.filter(modal => modal.id !== id)
        }))
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    { name: 'data-store' }
  )
)

// Utility hooks
export const useProjectOptions = () => {
  const projects = useDataStore((state) => state.projects)
  return projects.map(project => ({
    label: project.name,
    value: project.id,
    description: project.description,
    color: project.color,
  }))
}

export const useRecentProjects = (limit = 5) => {
  const recentEntries = useDataStore((state) => state.recentEntries)

  // Get unique projects from recent entries
  const recentProjectIds = new Set()
  const recentProjects: Project[] = []

  recentEntries.forEach(entry => {
    if (entry.project && !recentProjectIds.has(entry.project.id)) {
      recentProjectIds.add(entry.project.id)
      recentProjects.push(entry.project)
    }
  })

  return recentProjects.slice(0, limit)
}

// Hook for dashboard stats
export const useDashboardStats = () => {
  const { dashboardSummary, isLoadingDashboard, dashboardPeriod } = useDataStore()

  if (!dashboardSummary) {
    return { isLoading: isLoadingDashboard, stats: null, period: dashboardPeriod }
  }

  const stats = {
    totalTime: dashboardSummary.totals.total_time,
    billableTime: dashboardSummary.totals.billable_time,
    totalEntries: dashboardSummary.totals.total_entries,
    averageSession: dashboardSummary.productivity_metrics.average_session_length,
    projectBreakdown: dashboardSummary.project_breakdown,
    dailyBreakdown: dashboardSummary.daily_breakdown,
  }

  return { isLoading: isLoadingDashboard, stats, period: dashboardPeriod }
}