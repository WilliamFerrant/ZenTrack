// Main navigation header component
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore, useTimerStore, useFormattedElapsedTime } from '@/stores'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isLoggingOut } = useAuthStore()
  const { isRunning, currentTimer } = useTimerStore()
  const elapsedTime = useFormattedElapsedTime()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems = [
    { name: 'Dashboard', href: '/app/dashboard' },
    { name: 'Tracking',  href: '/app/tracking' },
    { name: 'Projects',  href: '/app/projects' },
    { name: 'Reports',   href: '/app/reports' },
  ]

  return (
    <header className="bg-[#0c0c0e] border-b border-gray-800 sticky top-0 z-40">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-6">
          <Link href="/app/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">Z</span>
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">ZenTrack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 ml-auto">
            {isRunning && currentTimer && (
              <Link
                href="/app/tracking"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-950 border border-green-800 text-green-400 rounded-full text-xs font-mono hover:bg-green-900 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {elapsedTime}
              </Link>
            )}

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm text-gray-300 font-medium">
                  {user?.first_name || 'User'}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/app/profile"
                      className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
