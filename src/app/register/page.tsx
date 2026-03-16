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
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const validateForm = () => {
    const errors: typeof fieldErrors = {}
    if (!formState.full_name.trim()) errors.full_name = 'Full name is required'
    if (!formState.email) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formState.email)) errors.email = 'Please enter a valid email address'
    if (!formState.password) errors.password = 'Password is required'
    else if (formState.password.length < 8) errors.password = 'Password must be at least 8 characters'
    if (!formState.confirmPassword) errors.confirmPassword = 'Please confirm your password'
    else if (formState.password !== formState.confirmPassword) errors.confirmPassword = 'Passwords do not match'
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
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      hasError ? 'border-red-500/50' : 'border-zinc-700'
    }`

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 py-12 px-4">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">ZenTracker</h1>
          <h2 className="text-lg font-semibold text-zinc-200 mb-1">Create your account</h2>
          <p className="text-zinc-400 text-sm">Start tracking your time for free</p>
        </div>

        {serverError && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              value={formState.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
              className={inputClass(!!fieldErrors.full_name)}
              placeholder="John Doe"
            />
            {fieldErrors.full_name && <p className="mt-1.5 text-sm text-red-400">{fieldErrors.full_name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formState.email}
              onChange={e => handleChange('email', e.target.value)}
              className={inputClass(!!fieldErrors.email)}
              placeholder="you@example.com"
            />
            {fieldErrors.email && <p className="mt-1.5 text-sm text-red-400">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={formState.showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formState.password}
                onChange={e => handleChange('password', e.target.value)}
                className={inputClass(!!fieldErrors.password) + ' pr-16'}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setFormState(p => ({ ...p, showPassword: !p.showPassword }))}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium"
              >
                {formState.showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1.5 text-sm text-red-400">{fieldErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={formState.showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={formState.confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
              className={inputClass(!!fieldErrors.confirmPassword)}
              placeholder="Repeat your password"
            />
            {fieldErrors.confirmPassword && <p className="mt-1.5 text-sm text-red-400">{fieldErrors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </button>

          <p className="text-center text-sm text-zinc-500 pt-1">
            Already have an account?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
