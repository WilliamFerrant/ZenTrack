// Login page
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    // Redirect to app if already authenticated
    if (!isLoading && isAuthenticated) {
      router.replace('/app/tracking')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render login form if already authenticated (while redirecting)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex bg-zinc-900 items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <LoginForm />
      </div>
    </div>
  )
}