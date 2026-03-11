// Authentication initializer component that runs on app startup
'use client'

import { useEffect, ReactNode } from 'react'
import { initializeAuth } from '@/stores/authStore'

interface AuthInitializerProps {
  children: ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  useEffect(() => {
    // Initialize authentication state from localStorage on app startup
    initializeAuth()
  }, [])

  return <>{children}</>
}