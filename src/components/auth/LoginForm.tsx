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
    } else if (formState.password.length < 1) {
      errors.password = 'Password is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) {
      return
    }

    try {
      const credentials: LoginRequest = {
        email: formState.email.trim(),
        password: formState.password,
        remember_me: formState.rememberMe,
      }

      await login(credentials)

      // Success callback
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
      }
    } catch (err: any) {
      // Error is handled by the store, but we can add additional UI feedback here
      console.error('Login failed:', err)

      // Provide specific feedback for certain error types
      if (err?.status === 401) {
        // The error is already set by the store, no need to duplicate
        console.log('Invalid credentials provided')
      } else if (err?.status === 429) {
        // Rate limiting
        console.log('Too many login attempts, please try again later')
      } else if (!navigator.onLine) {
        // Network error
        console.log('No internet connection')
      }
    }
  }

  const handleFieldChange = (field: keyof LoginFormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }))

    // Clear field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Zentracker
        </h1>
        <p className="text-gray-600">
          Sign in to your account to track your time
        </p>
      </div>

      {/* Global Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="text-red-800 text-sm">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={formState.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={`
              w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
              ${fieldErrors.email ? 'border-red-300' : 'border-gray-300'}
            `}
            placeholder="Enter your email"
            disabled={isLoggingIn}
            autoComplete="email"
            autoFocus
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={formState.showPassword ? 'text' : 'password'}
              id="password"
              value={formState.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              className={`
                w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${fieldErrors.password ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Enter your password"
              disabled={isLoggingIn}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => handleFieldChange('showPassword', !formState.showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoggingIn}
            >
              {formState.showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember-me"
            checked={formState.rememberMe}
            onChange={(e) => handleFieldChange('rememberMe', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoggingIn}
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoggingIn}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${isLoggingIn
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }
          `}
        >
          {isLoggingIn ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Footer Links */}
        <div className="text-center text-sm">
          <a href="#" className="text-blue-600 hover:text-blue-500">
            Forgot your password?
          </a>
        </div>

        {/* Register Link */}
        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign up
          </a>
        </div>
      </form>
    </div>
  )
}