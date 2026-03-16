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
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-zinc-400">Sign in to your account to track your time</p>
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
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={formState.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              fieldErrors.email ? 'border-red-500/50' : 'border-zinc-700'
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
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={formState.showPassword ? 'text' : 'password'}
              id="password"
              value={formState.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              className={`w-full px-4 py-3 pr-16 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                fieldErrors.password ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              placeholder="••••••••"
              disabled={isLoggingIn}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => handleFieldChange('showPassword', !formState.showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium"
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
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            disabled={isLoggingIn}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
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
          <a href="#" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Forgot your password?
          </a>
        </div>

        <div className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign up
          </a>
        </div>
      </form>
    </div>
  )
}
