// Login form component for user authentication
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import type { LoginRequest } from '@/types'

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

interface LoginFormState {
  email: string
  password: string
  rememberMe: boolean
  showPassword: boolean
}

export function LoginForm({ onSuccess, redirectTo = '/app/tracking' }: LoginFormProps) {
  const router = useRouter()
  const { login, isLoggingIn, error, clearError } = useAuthStore()

  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: false,
    showPassword: false,
  })

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validateForm = () => {
    const errors: typeof fieldErrors = {}

    if (!formState.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formState.password) {
      errors.password = 'Password is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) return

    try {
      const credentials: LoginRequest = {
        email: formState.email.trim(),
        password: formState.password,
        remember_me: formState.rememberMe,
      }
      await login(credentials)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }
    } catch (err: any) {
      console.error('Login failed:', err)
    }
  }

  const handleFieldChange = (field: keyof LoginFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account to track your time</p>
      </div>

      {/* Global Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground/80 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={formState.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={`w-full px-4 py-3 bg-white/[0.06] border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
              fieldErrors.email ? 'border-red-500/50' : 'border-border/40'
            }`}
            placeholder="you@example.com"
            disabled={isLoggingIn}
            autoComplete="email"
            autoFocus
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-sm text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={formState.showPassword ? 'text' : 'password'}
              id="password"
              value={formState.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              className={`w-full px-4 py-3 pr-16 bg-white/[0.06] border rounded-xl text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors ${
                fieldErrors.password ? 'border-red-500/50' : 'border-border/40'
              }`}
              placeholder="••••••••"
              disabled={isLoggingIn}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => handleFieldChange('showPassword', !formState.showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              disabled={isLoggingIn}
            >
              {formState.showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-sm text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember-me"
            checked={formState.rememberMe}
            onChange={(e) => handleFieldChange('rememberMe', e.target.checked)}
            className="h-4 w-4 rounded border-border/40 bg-white/[0.06] text-blue-600 focus:ring-primary/50 focus:ring-offset-0"
            disabled={isLoggingIn}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
        >
          {isLoggingIn ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Links */}
        <div className="text-center">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Forgot your password?
          </a>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign up
          </a>
        </div>
      </form>
    </div>
  )
}
