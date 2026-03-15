// Authentication initializer component that runs on app startup
'use client'

import { useEffect, ReactNode } from 'react'
import { initializeAuth } from '@/stores/authStore'
import { useAuthStore } from '@/stores'
import { config } from '@/lib/config'

interface AuthInitializerProps {
  children: ReactNode
}

const MOCK_USER = {
  id: 'mock-user-1',
  email: 'dev@localhost.local',
  first_name: 'Dev',
  last_name: 'Local',
  role: 'ADMIN' as const,
  organization_id: 'mock-org-1',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
}

const MOCK_TOKENS = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer' as const,
  expires_in: 86400,
  expires_at: new Date(Date.now() + 86400 * 1000),
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  useEffect(() => {
    if (config.mockMode) {
      useAuthStore.getState().setUser(MOCK_USER)
      useAuthStore.getState().setTokens(MOCK_TOKENS)
      useAuthStore.setState({ isAuthenticated: true, isLoading: false })
      return
    }
    initializeAuth()
  }, [])

  return <>{children}</>
}