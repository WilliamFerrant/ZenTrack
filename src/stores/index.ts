// Store exports and utilities
export { useAuthStore, initializeAuth, useHasRole, useIsInOrganization } from './authStore'
export { useTimerStore, formatElapsedTime, formatDuration, useFormattedElapsedTime, useTimerStatus } from './timerStore'
export { useDataStore, useProjectOptions, useRecentProjects, useDashboardStats } from './dataStore'

import { useAuthStore } from './authStore'
import { useTimerStore } from './timerStore'
import { useDataStore } from './dataStore'

// Combined hooks for common patterns
export const useAppInitialization = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const loadCurrentTimer = useTimerStore((state) => state.loadCurrentTimer)
  const refreshData = useDataStore((state) => state.refreshData)

  const initializeApp = async () => {
    if (isAuthenticated) {
      // Initialize timer and data stores for authenticated users
      await Promise.all([
        loadCurrentTimer(),
        refreshData(),
      ])
    }
  }

  return {
    isAuthenticated,
    isLoading,
    initializeApp,
  }
}

// Hook for global error handling
export const useGlobalError = () => {
  const authError = useAuthStore((state) => state.error)
  const timerError = useTimerStore((state) => state.error)
  const dataError = useDataStore((state) => state.error)

  const clearAuthError = useAuthStore((state) => state.clearError)
  const clearTimerError = useTimerStore((state) => state.clearError)
  const clearDataError = useDataStore((state) => state.clearError)

  const hasError = !!(authError || timerError || dataError)
  const errors = [authError, timerError, dataError].filter(Boolean)

  const clearAllErrors = () => {
    clearAuthError()
    clearTimerError()
    clearDataError()
  }

  return {
    hasError,
    errors,
    authError,
    timerError,
    dataError,
    clearAllErrors,
    clearAuthError,
    clearTimerError,
    clearDataError,
  }
}