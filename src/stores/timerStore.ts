// Timer store using Zustand
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { api } from '../lib/api'
import { config } from '../lib/config'
import type { Timer, Project, Task, TimerState, StartTimerRequest } from '../types'

interface TimerStore extends TimerState {
  // Timer management actions
  startTimer: (request?: StartTimerRequest) => Promise<void>
  stopTimer: () => Promise<void>
  pauseTimer: () => Promise<void>
  resumeTimer: () => Promise<void>

  // Timer state actions
  updateDescription: (description: string) => void
  updateElapsedTime: () => void
  setSelectedProject: (project: Project | null) => void
  setSelectedTask: (task: Task | null) => void

  // Data fetching
  loadCurrentTimer: () => Promise<void>

  // Error handling
  clearError: () => void

  // Internal state management
  _startElapsedTimer: () => void
  _stopElapsedTimer: () => void
  _setCurrentTimer: (timer: Timer | null) => void
}

let elapsedInterval: NodeJS.Timeout | null = null

export const useTimerStore = create<TimerStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentTimer: null,
      isRunning: false,
      elapsedTime: 0,
      isStarting: false,
      isStopping: false,
      selectedProject: null,
      selectedTask: null,
      description: '',
      error: null,

      // Timer management actions
      startTimer: async (request?: StartTimerRequest) => {
        try {
          const state = get()

          // Prevent starting if already running
          if (state.isRunning || state.isStarting) {
            throw new Error('Timer is already running')
          }

          set({ isStarting: true, error: null })

          // Use current form state if no request provided
          const startRequest: StartTimerRequest = {
            project_id: request?.project_id || state.selectedProject?.id,
            task_id: request?.task_id || state.selectedTask?.id,
            description: request?.description || state.description,
          }

          const timer = await api.post<Timer>('/timers/start', startRequest)

          // Use local start time to avoid clock skew from server response
          const localStartTime = new Date()
          const timerWithLocalStart = { ...timer, start_time: localStartTime }

          // Update state
          set({
            currentTimer: timerWithLocalStart,
            isRunning: true,
            elapsedTime: 0,
            isStarting: false,
            error: null,
          })

          // Start elapsed timer
          get()._startElapsedTimer()

        } catch (error: any) {
          let errorMessage = error.data?.detail || error.message || 'Failed to start timer'

          // Detect network connectivity issues
          if (error.message?.includes('Network error') || error.message?.includes('fetch')) {
            errorMessage = 'Unable to connect to server. Please check your internet connection.'
          } else if (error.status === 0) {
            errorMessage = 'No internet connection. Please check your network settings.'
          }

          set({
            isStarting: false,
            error: errorMessage,
          })
          throw error
        }
      },

      stopTimer: async () => {
        try {
          const state = get()

          if (!state.currentTimer || !state.isRunning) {
            throw new Error('No active timer to stop')
          }

          set({ isStopping: true, error: null })

          // Stop the timer on backend
          await api.post('/timers/stop', {
            description: state.description,
          })

          // Stop elapsed timer
          get()._stopElapsedTimer()

          // Clear timer state
          set({
            currentTimer: null,
            isRunning: false,
            elapsedTime: 0,
            isStopping: false,
            description: '',
            error: null,
          })

          // Refresh recent entries in data store
          // Note: This would ideally trigger a refresh in dataStore
          // but we keep stores decoupled for now

        } catch (error: any) {
          let errorMessage = error.data?.detail || error.message || 'Failed to stop timer'

          // Detect network connectivity issues
          if (error.message?.includes('Network error') || error.message?.includes('fetch')) {
            errorMessage = 'Unable to connect to server. Timer data will be saved when connection is restored.'
          } else if (error.status === 0) {
            errorMessage = 'No internet connection. Timer data will be saved when you reconnect.'
          }

          set({
            isStopping: false,
            error: errorMessage,
          })
          throw error
        }
      },

      pauseTimer: async () => {
        // For MVP, we'll implement this as stop/start pattern
        // Future enhancement: proper pause/resume with backend support
        try {
          const state = get()
          if (!state.isRunning) return

          // TODO: Implement proper pause endpoint
          console.warn('Pause functionality not implemented in MVP')
        } catch (error) {
          console.error('Pause timer failed:', error)
        }
      },

      resumeTimer: async () => {
        // For MVP, manual start required
        try {
          const state = get()
          if (state.isRunning) return

          // TODO: Implement proper resume endpoint
          console.warn('Resume functionality not implemented in MVP')
        } catch (error) {
          console.error('Resume timer failed:', error)
        }
      },

      updateDescription: (description: string) => {
        set({ description })

        // Auto-save description if timer is running (debounced)
        const state = get()
        if (state.isRunning && state.currentTimer) {
          // TODO: Implement debounced auto-save
          // For now, description is only saved on stop
        }
      },

      updateElapsedTime: () => {
        const state = get()
        if (state.isRunning && state.currentTimer) {
          const startTime = new Date(state.currentTimer.start_time)
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
          set({ elapsedTime: elapsed })
        }
      },

      setSelectedProject: (project: Project | null) => {
        set({
          selectedProject: project,
          // Clear task if project changed
          selectedTask: project?.id !== get().selectedProject?.id ? null : get().selectedTask
        })
      },

      setSelectedTask: (task: Task | null) => {
        set({ selectedTask: task })

        // Auto-select project if task belongs to a different project
        if (task && task.project_id !== get().selectedProject?.id) {
          // Note: We'd need to fetch the project or have it populated
          // For now, just clear project selection
          set({ selectedProject: null })
        }
      },

      loadCurrentTimer: async () => {
        try {
          set({ error: null })

          const timer = await api.get<Timer>('/timers/active')

          if (timer) {
            // Force UTC parse: backend returns naive datetime strings without 'Z'
            const rawStart = String(timer.start_time)
            const utcString = rawStart.endsWith('Z') || rawStart.includes('+') ? rawStart : rawStart + 'Z'
            const startTime = new Date(utcString)
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)

            set({
              currentTimer: timer,
              isRunning: timer.is_running,
              elapsedTime: elapsed,
              description: timer.description || '',
            })

            // Start elapsed timer if running
            if (timer.is_running) {
              get()._startElapsedTimer()
            }
          } else {
            // No active timer
            set({
              currentTimer: null,
              isRunning: false,
              elapsedTime: 0,
            })
          }

        } catch (error: any) {
          // If no timer exists, that's not an error
          if (error.status === 404) {
            set({
              currentTimer: null,
              isRunning: false,
              elapsedTime: 0,
            })
          } else {
            const errorMessage = error.data?.detail || 'Failed to load current timer'
            set({ error: errorMessage })
            console.error('Load current timer failed:', error)
          }
        }
      },

      clearError: () => {
        set({ error: null })
      },

      // Internal methods
      _startElapsedTimer: () => {
        // Clear any existing interval
        if (elapsedInterval) {
          clearInterval(elapsedInterval)
        }

        // Start new interval
        elapsedInterval = setInterval(() => {
          get().updateElapsedTime()
        }, config.timer.updateInterval)
      },

      _stopElapsedTimer: () => {
        if (elapsedInterval) {
          clearInterval(elapsedInterval)
          elapsedInterval = null
        }
      },

      _setCurrentTimer: (timer: Timer | null) => {
        set({ currentTimer: timer })
      },
    }),
    { name: 'timer-store' }
  )
)

// Utility functions for formatting time
export const formatElapsedTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return `${seconds}s`
  }
}

// Hook for formatted elapsed time
export const useFormattedElapsedTime = (): string => {
  const elapsedTime = useTimerStore((state) => state.elapsedTime)
  return formatElapsedTime(elapsedTime)
}

// Hook for timer status info
export const useTimerStatus = () => {
  const { currentTimer, isRunning, isStarting, isStopping, error } = useTimerStore()

  return {
    hasActiveTimer: !!currentTimer,
    isRunning,
    isStarting,
    isStopping,
    isLoading: isStarting || isStopping,
    canStart: !isRunning && !isStarting && !isStopping,
    canStop: isRunning && !isStopping,
    error,
  }
}

// Auto-cleanup on unmount or page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (elapsedInterval) {
      clearInterval(elapsedInterval)
    }
  })
}