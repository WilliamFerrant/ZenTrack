// Register page
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores'
import { api } from '@/lib/api'

interface RegisterFormState {
  full_name: string
  email: string
  password: string
  confirmPassword: string
  showPassword: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  const [formState, setFormState] = useState<RegisterFormState>({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
  })

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormState, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/app/tracking')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const validateForm = () => {
    const errors: typeof fieldErrors = {}

    if (!formState.full_name.trim()) {
      errors.full_name = 'Full name is required'
    }

    if (!formState.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formState.password) {
      errors.password = 'Password is required'
    } else if (formState.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!formState.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formState.password !== formState.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await api.post('/auth/register', {
        full_name: formState.full_name.trim(),
        email: formState.email.trim(),
        password: formState.password,
      })
      router.push('/login?registered=1')
    } catch (err: any) {
      setServerError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof RegisterFormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">ZenTracker</h1>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">Start tracking your time for free</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8 space-y-5">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              value={formState.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.full_name ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formState.email}
              onChange={e => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.email ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={formState.showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formState.password}
                onChange={e => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${
                  fieldErrors.password ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setFormState(p => ({ ...p, showPassword: !p.showPassword }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {formState.showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={formState.showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formState.confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="Repeat your password"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              'Create account'
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
