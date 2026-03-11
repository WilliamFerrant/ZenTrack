// Main navigation header
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleLogout = async () => {
    try { await logout(); router.push('/login') } catch {}
  }

  const nav = [
    { label: 'Dashboard', href: '/app/dashboard' },
    { label: 'Tracking',  href: '/app/tracking' },
    { label: 'Projects',  href: '/app/projects' },
    { label: 'Reports',   href: '/app/reports' },
  ]

  return (
    <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] sticky top-0 z-40">
      <div className="mx-auto px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">

          {/* Logo */}
          <Link href="/app/dashboard" className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <div className="w-7 h-7 bg-[#b0c4b1] rounded-xl flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#1f1f1f]" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16z" opacity=".3"/>
              </svg>
            </div>
            <span className="text-[#e5e7eb] font-semibold text-sm tracking-tight">ZenTrack</span>
          </Link>

          {/* Nav pills */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {nav.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.label} href={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#b0c4b1]/15 text-[#b0c4b1]'
                      : 'text-[#6b7280] hover:text-[#e5e7eb] hover:bg-[#2a2a2a]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Live timer chip */}
            {isRunning && currentTimer && (
              <Link href="/app/tracking"
                className="flex items-center gap-2 px-3 py-1.5 bg-[#b0c4b1]/10 border border-[#b0c4b1]/25 text-[#b0c4b1] rounded-full text-xs font-mono hover:bg-[#b0c4b1]/20 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-[#b0c4b1] rounded-full animate-pulse" />
                {elapsedTime}
              </Link>
            )}

            {/* Avatar / menu */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#2a2a2a] transition-colors"
              >
                <div className="w-7 h-7 bg-[#b0c4b1] text-[#1f1f1f] rounded-full flex items-center justify-center text-xs font-bold">
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm text-[#9ca3af] font-medium">
                  {user?.first_name || 'User'}
                </span>
                <svg className="w-3 h-3 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[#222] border border-[#333] rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2e2e2e]">
                    <p className="text-sm font-semibold text-[#e5e7eb]">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-[#555] truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="py-1.5">
                    <Link href="/app/profile"
                      className="block px-4 py-2 text-sm text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#2a2a2a] transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >Profile</Link>
                    <button onClick={handleLogout} disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#2a2a2a] transition-colors disabled:opacity-40"
                    >{isLoggingOut ? 'Signing out…' : 'Sign out'}</button>
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
