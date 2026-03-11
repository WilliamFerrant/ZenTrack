// Protected route component for authentication guard
'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string | string[]
  redirectTo?: string
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
  fallback = <LoadingSpinner />,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()

  useEffect(() => {
    // Wait for auth state to be loaded
    if (isLoading) return

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.replace(redirectTo)
      return
    }

    // Check role requirements if specified
    if (requiredRole && user) {
      const hasRequiredRole = Array.isArray(requiredRole)
        ? requiredRole.includes(user.role)
        : user.role === requiredRole

      if (!hasRequiredRole) {
        // Redirect to unauthorized page or home
        router.replace('/app/dashboard')
        return
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo])

  // Show loading while checking auth
  if (isLoading) {
    return <>{fallback}</>
  }

  // Show loading if not authenticated (while redirecting)
  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  // Check role authorization
  if (requiredRole && user) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(user.role)
      : user.role === requiredRole

    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}