// Authentication store using Zustand
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { api } from '../lib/api'
import type { User, AuthTokens, LoginRequest, AuthState } from '../types'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshTokens: () => Promise<AuthTokens>
  loadUser: () => Promise<void>
  clearError: () => void
  setUser: (user: User) => void
  setTokens: (tokens: AuthTokens) => void
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isLoggingIn: false,
        isLoggingOut: false,
        error: null,

        // Actions
        login: async (credentials: LoginRequest) => {
          try {
            set({ isLoggingIn: true, error: null })

            const response = await api.post<{
              message: string
              data: {
                access_token: string
                refresh_token: string
                expires_in: number
                token_type: string
              }
              user: User
            }>('/auth/login', credentials)

            const tokens: AuthTokens = {
              access_token: response.data.access_token,
              refresh_token: response.data.refresh_token,
              token_type: response.data.token_type as 'bearer',
              expires_in: response.data.expires_in,
              expires_at: new Date(Date.now() + response.data.expires_in * 1000),
            }

            // Store tokens in localStorage for persistence
            localStorage.setItem('access_token', tokens.access_token)
            localStorage.setItem('refresh_token', tokens.refresh_token)
            localStorage.setItem('token_expiry', tokens.expires_at.toISOString())

            set({
              user: response.user,
              tokens,
              isAuthenticated: true,
              isLoggingIn: false,
              error: null,
            })
          } catch (error: any) {
            const errorMessage = error.data?.detail || error.message || 'Login failed'
            set({
              isLoggingIn: false,
              error: errorMessage,
              isAuthenticated: false,
              user: null,
              tokens: null,
            })
            throw error
          }
        },

        logout: () => {
          try {
            set({ isLoggingOut: true })

            // Clear localStorage
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token_expiry')

            // Clear state
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoggingOut: false,
              error: null,
            })

            // Optional: Call logout endpoint to invalidate tokens on server
            // Use raw fetch to avoid the api interceptor triggering another logout loop
            const token = localStorage.getItem('access_token')
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/logout`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            }).catch(() => {
              console.warn('Failed to invalidate tokens on server')
            })
          } catch (error) {
            console.error('Logout error:', error)
            set({ isLoggingOut: false })
          }
        },

        refreshTokens: async () => {
          const { tokens } = get()
          if (!tokens?.refresh_token) {
            throw new Error('No refresh token available')
          }

          try {
            const response = await api.post<{
              access_token: string
              refresh_token: string
              expires_in: number
              token_type: string
            }>('/auth/refresh', {
              refresh_token: tokens.refresh_token,
            })

            const newTokens: AuthTokens = {
              access_token: response.access_token,
              refresh_token: response.refresh_token,
              token_type: response.token_type as 'bearer',
              expires_in: response.expires_in,
              expires_at: new Date(Date.now() + response.expires_in * 1000),
            }

            // Update localStorage
            localStorage.setItem('access_token', newTokens.access_token)
            localStorage.setItem('refresh_token', newTokens.refresh_token)
            localStorage.setItem('token_expiry', newTokens.expires_at.toISOString())

            set({
              tokens: newTokens,
              error: null,
            })

            return newTokens
          } catch (error) {
            // Refresh failed, logout user
            get().logout()
            throw error
          }
        },

        loadUser: async () => {
          const { tokens } = get()
          if (!tokens?.access_token) {
            return
          }

          try {
            set({ isLoading: true })

            const user = await api.get<User>('/auth/me')

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } catch (error: any) {
            console.error('Failed to load user:', error)

            // If token is invalid, try refresh
            if (error.status === 401) {
              try {
                await get().refreshTokens()
                await get().loadUser() // Retry after refresh
              } catch (refreshError) {
                get().logout()
              }
            } else {
              set({
                isLoading: false,
                error: 'Failed to load user profile',
              })
            }
          }
        },

        clearError: () => {
          set({ error: null })
        },

        setUser: (user: User) => {
          set({ user })
        },

        setTokens: (tokens: AuthTokens) => {
          set({ tokens })
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          // Only persist essential auth state
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
)

// Auto-initialize auth state from localStorage on app start
export const initializeAuth = () => {
  const token = localStorage.getItem('access_token')
  const refreshToken = localStorage.getItem('refresh_token')
  const expiryStr = localStorage.getItem('token_expiry')

  if (token && refreshToken && expiryStr) {
    const expiry = new Date(expiryStr)
    const now = new Date()

    // Check if token is expired
    if (expiry > now) {
      // Token still valid, load user
      const tokens: AuthTokens = {
        access_token: token,
        refresh_token: refreshToken,
        token_type: 'bearer',
        expires_in: Math.floor((expiry.getTime() - now.getTime()) / 1000),
        expires_at: expiry,
      }

      useAuthStore.getState().setTokens(tokens)
      useAuthStore.getState().loadUser()
    } else {
      // Token expired, try refresh
      const tokens: AuthTokens = {
        access_token: token,
        refresh_token: refreshToken,
        token_type: 'bearer',
        expires_in: 0,
        expires_at: expiry,
      }

      useAuthStore.getState().setTokens(tokens)
      useAuthStore.getState().refreshTokens().catch(() => {
        // Refresh failed, logout
        useAuthStore.getState().logout()
      })
    }
  }
}

// Utility hook for checking if user has specific role
export const useHasRole = (requiredRole: string | string[]) => {
  const user = useAuthStore((state) => state.user)

  if (!user) return false

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(user.role)
}

// Utility hook for checking if user belongs to organization
export const useIsInOrganization = (organizationId: string) => {
  const user = useAuthStore((state) => state.user)
  return user?.organization_id === organizationId
}