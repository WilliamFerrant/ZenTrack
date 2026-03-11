import pathlib

root = pathlib.Path(r"c:\web dev\time-tracker")

# ─── tailwind.config.js ── add custom palette ────────────────────────────────
tw = r"""/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1f1f1f',
          card:    '#272727',
          hover:   '#2e2e2e',
          border:  '#333333',
        },
        accent: {
          DEFAULT: '#b0c4b1',
          hover:   '#c4d5c5',
          muted:   '#728c74',
        },
        text: {
          primary:   '#e5e7eb',
          secondary: '#9ca3af',
          muted:     '#6b7280',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
"""
(root / "tailwind.config.js").write_text(tw, encoding="utf-8")
print("tailwind.config.js written")

# ─── globals.css ─────────────────────────────────────────────────────────────
css = """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #1f1f1f;
    color: #e5e7eb;
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: #333 transparent;
  }
}

@layer components {
  .card {
    @apply bg-[#272727] border border-[#333] rounded-3xl;
  }
  .btn-accent {
    @apply bg-[#b0c4b1] hover:bg-[#c4d5c5] text-[#1f1f1f] font-semibold rounded-2xl transition-colors disabled:opacity-40;
  }
  .btn-ghost {
    @apply bg-[#2e2e2e] hover:bg-[#363636] text-[#e5e7eb] font-medium rounded-2xl transition-colors;
  }
  .input-dark {
    @apply w-full bg-[#2e2e2e] border border-[#3a3a3a] text-[#e5e7eb] placeholder-[#555] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#b0c4b1] transition-colors;
  }
  .tag {
    @apply px-2.5 py-1 rounded-lg text-xs font-medium transition-colors;
  }
}
"""
(root / "src/app/globals.css").write_text(css, encoding="utf-8")
print("globals.css written")

# ─── Header.tsx ──────────────────────────────────────────────────────────────
header = r"""// Main navigation header
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
"""
(root / "src/components/layout/Header.tsx").write_text(header, encoding="utf-8")
print("Header.tsx written")

# ─── AppLayout.tsx ─────────────────────────────────────────────────────────────
layout = r"""// Main application layout
'use client'

import { ReactNode, useEffect } from 'react'
import { Header } from './Header'
import { ToastContainer } from '../ui/ToastContainer'
import { ModalContainer } from '../ui/ModalContainer'
import { NetworkStatusIndicator } from '../ui/NetworkStatusIndicator'
import { useAppInitialization } from '@/stores'

export interface AppLayoutProps {
  children: ReactNode
  title?: string
  showSidebar?: boolean
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, initializeApp } = useAppInitialization()

  useEffect(() => {
    if (isAuthenticated) {
      initializeApp().catch(console.error)
    }
  }, [isAuthenticated, initializeApp])

  return (
    <div className="min-h-screen bg-[#1f1f1f]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}
"""
(root / "src/components/layout/AppLayout.tsx").write_text(layout, encoding="utf-8")
print("AppLayout.tsx written")

# ─── dashboard/page.tsx ────────────────────────────────────────────────────────
dashboard = r"""// Dashboard page — modern bento layout
'use client'

import { useState, useEffect } from 'react'
import { useDataStore, useTimerStore, useFormattedElapsedTime } from '@/stores'
import { api } from '@/lib/api'

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtTime(sec: number): string {
  if (!sec) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function toDate(v: unknown): Date {
  return v instanceof Date ? v : new Date(String(v))
}
function isToday(v: unknown) {
  const d = toDate(v), t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}
function isThisWeek(v: unknown) {
  const d = toDate(v), s = new Date()
  s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0)
  return d >= s
}
function isThisMonth(v: unknown) {
  const d = toDate(v), t = new Date()
  return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}
function fmtClock(v: unknown) {
  return toDate(v).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Arc gauge ─────────────────────────────────────────────────────────────────
function ArcGauge({ pct }: { pct: number }) {
  const r = 36, cx = 52, cy = 52
  const full = Math.PI * r        // half arc
  const filled = pct * full
  const x = (a: number) => cx + r * Math.cos(a)
  const y = (a: number) => cy + r * Math.sin(a)
  const arc = (a1: number, a2: number, color: string) => {
    const d = `M ${x(a1)} ${y(a1)} A ${r} ${r} 0 ${a2 - a1 > Math.PI ? 1 : 0} 1 ${x(a2)} ${y(a2)}`
    return <path d={d} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
  }
  const a0 = Math.PI, a1 = Math.PI + pct * Math.PI
  return (
    <svg viewBox="0 0 104 74" className="w-full max-w-[140px]">
      {arc(Math.PI, 2 * Math.PI, '#2e2e2e')}
      {pct > 0 && arc(a0, a1, '#b0c4b1')}
      <circle cx={x(a1)} cy={y(a1)} r="5" fill="#b0c4b1" />
    </svg>
  )
}

// ── Donut ─────────────────────────────────────────────────────────────────────
function Donut({ val, total, label }: { val: number; total: number; label: string }) {
  const r = 30, circ = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(val / total, 1) : 0
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#2e2e2e" strokeWidth="10" />
      {pct > 0 && (
        <circle cx="40" cy="40" r={r} fill="none" stroke="#b0c4b1" strokeWidth="10"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
      )}
      <text x="40" y="44" textAnchor="middle" fontSize="13" fontWeight="700" fill="#e5e7eb">
        {total > 0 ? `${Math.round(pct * 100)}%` : '—'}
      </text>
      <text x="40" y="56" textAnchor="middle" fontSize="7" fill="#6b7280">{label}</text>
    </svg>
  )
}

// ── Toggle chip ───────────────────────────────────────────────────────────────
function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-9 h-5 rounded-full relative transition-colors ${on ? 'bg-[#b0c4b1]' : 'bg-[#333]'}`}>
      <div className={`absolute top-1 w-3 h-3 rounded-full shadow transition-all ${on ? 'left-5 bg-[#1f1f1f]' : 'left-1 bg-[#555]'}`} />
    </div>
  )
}

// ── Bar chart (weekly daily breakdown) ───────────────────────────────────────
function WeekBars({ data }: { data: Array<{ date: string; total_time: number }> }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const max = Math.max(...data.map(d => d.total_time), 1)
  const today = new Date().getDay()

  return (
    <div className="flex items-end gap-1.5 h-12">
      {days.map((d, i) => {
        const entry = data[i]
        const h = entry ? (entry.total_time / max) * 100 : 0
        const isToday2 = (i + 1) % 7 === today % 7
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="w-full rounded-sm transition-all"
              style={{ height: `${Math.max(h, 4)}%`, backgroundColor: isToday2 ? '#b0c4b1' : (h > 0 ? '#3a4a3b' : '#2a2a2a') }} />
            <span className={`text-[9px] ${isToday2 ? 'text-[#b0c4b1]' : 'text-[#444]'}`}>{d}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [tab, setTab] = useState<'today' | 'week' | 'month' | 'all'>('today')
  const [weekData, setWeekData] = useState<any>(null)

  const {
    recentEntries, projects, dashboardSummary, isLoadingEntries,
    fetchRecentEntries, fetchProjects, fetchDashboardSummary,
  } = useDataStore()

  const {
    isRunning, isStarting, isStopping, currentTimer,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()

  const elapsed = useFormattedElapsedTime()

  useEffect(() => {
    fetchRecentEntries(50)
    fetchProjects()
    fetchDashboardSummary('day')
    api.get<any>('/dashboard/summary?period=week').then(setWeekData).catch(() => {})
  }, []) // eslint-disable-line

  const entries = recentEntries.filter(e => {
    if (tab === 'today') return isToday(e.start_time)
    if (tab === 'week')  return isThisWeek(e.start_time)
    if (tab === 'month') return isThisMonth(e.start_time)
    return true
  })

  const todaySec    = dashboardSummary?.totals?.total_time    ?? 0
  const billableSec = dashboardSummary?.totals?.billable_time ?? 0
  const nEntries    = dashboardSummary?.totals?.total_entries ?? 0
  const goalPct     = Math.min(todaySec / (8 * 3600), 1)
  const weekTotal   = weekData?.totals?.total_time    ?? 0
  const weekBill    = weekData?.totals?.billable_time ?? 0
  const weekBars    = weekData?.daily_breakdown ?? []
  const projBreak   = dashboardSummary?.project_breakdown ?? []

  const handleStart = async () => {
    try { await startTimer({ project_id: selectedProject?.id, description: description.trim() || undefined }) } catch {}
  }
  const handleStop = async () => {
    try { await stopTimer() } catch {}
  }

  return (
    <div className="space-y-3">

      {/* ── Row 1 ── */}
      <div className="grid grid-cols-12 gap-3">

        {/* Time entries (wide) */}
        <div className="col-span-7 bg-[#252525] border border-[#2e2e2e] rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#e5e7eb]">Time Entries</h2>
              <p className="text-xs text-[#555] mt-0.5">{entries.length} entries</p>
            </div>
            <div className="flex gap-1">
              {(['today', 'week', 'month', 'all'] as const).map(p => (
                <button key={p} onClick={() => setTab(p)}
                  className={`tag capitalize ${tab === p ? 'bg-[#b0c4b1]/15 text-[#b0c4b1]' : 'bg-[#2e2e2e] text-[#555] hover:text-[#9ca3af]'}`}
                >{p}</button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-56 pr-1">
            {isLoadingEntries
              ? [...Array(4)].map((_, i) => <div key={i} className="h-11 bg-[#2a2a2a] rounded-2xl animate-pulse" />)
              : entries.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-[#555] text-sm">○</div>
                  <p className="text-xs text-[#555]">No entries for this period</p>
                </div>
              )
              : entries.map(entry => (
                <div key={entry.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 bg-[#2a2a2a] hover:bg-[#303030] rounded-2xl transition-colors group cursor-default"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: (entry as any).project?.color || '#b0c4b1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e5e7eb] truncate leading-none">
                      {entry.description || (entry as any).project?.name || 'No description'}
                    </p>
                    <p className="text-xs text-[#555] mt-0.5 truncate">
                      {(entry as any).project?.name || '—'} · {fmtClock(entry.start_time)}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#9ca3af] tabular-nums">{fmtTime(entry.duration)}</span>
                  {entry.is_billable && (
                    <span className="text-[10px] text-[#b0c4b1] bg-[#b0c4b1]/10 px-1.5 py-0.5 rounded-md">$</span>
                  )}
                </div>
              ))
            }
          </div>
        </div>

        {/* Timer panel */}
        <div className="col-span-5 bg-[#252525] border border-[#2e2e2e] rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#e5e7eb]">Timer</h2>
              <p className="text-xs text-[#555] mt-0.5">
                {isRunning ? `Running · ${currentTimer?.project?.name || 'No project'}` : 'Ready'}
              </p>
            </div>
            <Toggle on={isRunning} />
          </div>

          {/* Arc gauge */}
          <div className="flex flex-col items-center my-2">
            <ArcGauge pct={goalPct} />
            <div className="-mt-2 text-center">
              <p className="text-2xl font-bold text-[#e5e7eb] tracking-tight leading-none">
                {isRunning ? elapsed : fmtTime(todaySec)}
              </p>
              <p className="text-xs text-[#555] mt-1">
                {isRunning ? 'elapsed' : `${Math.round(goalPct * 100)}% of daily goal`}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 mt-2">
            <div>
              <label className="block text-xs text-[#555] mb-1">Project</label>
              <div className="relative">
                {selectedProject && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10"
                    style={{ backgroundColor: selectedProject.color || '#b0c4b1' }} />
                )}
                <select
                  value={selectedProject?.id ?? ''}
                  onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
                  className={`input-dark pr-3 ${selectedProject ? 'pl-7' : 'pl-3'}`}
                >
                  <option value="">Select project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#555] mb-1">Description</label>
              <input type="text" value={description} onChange={e => updateDescription(e.target.value)}
                placeholder="What are you working on?" className="input-dark" />
            </div>

            {isRunning ? (
              <div className="flex gap-2 pt-1">
                <div className="flex-1 bg-[#b0c4b1]/8 border border-[#b0c4b1]/20 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#b0c4b1] rounded-full animate-pulse" />
                  <span className="font-mono text-[#b0c4b1] text-sm font-semibold">{elapsed}</span>
                </div>
                <button onClick={handleStop} disabled={isStopping}
                  className="px-4 py-2 bg-[#3a2222] hover:bg-[#4a2a2a] border border-[#6b3030] text-[#e87070] text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors">
                  {isStopping ? '…' : 'Stop'}
                </button>
              </div>
            ) : (
              <button onClick={handleStart} disabled={isStarting}
                className="w-full py-2.5 btn-accent text-sm">
                {isStarting ? 'Starting…' : '▶  Start Timer'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2 ── */}
      <div className="grid grid-cols-12 gap-3">

        {/* Today card */}
        <div className="col-span-3 bg-[#252525] border border-[#2e2e2e] rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#e5e7eb]">Today</h3>
            <Toggle on={isRunning} />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <span className="text-xs text-[#555]">Total</span>
              <p className="text-2xl font-bold text-[#e5e7eb] leading-tight">{fmtTime(todaySec)}</p>
            </div>
            <div>
              <span className="text-xs text-[#555]">Billable</span>
              <p className="text-sm font-semibold text-[#b0c4b1]">{fmtTime(billableSec)}</p>
            </div>
            <p className="text-xs text-[#555]">{nEntries} {nEntries === 1 ? 'entry' : 'entries'}</p>
          </div>
          <button onClick={isRunning ? handleStop : handleStart} disabled={isStarting || isStopping}
            className={`mt-4 w-full py-2 rounded-2xl text-xs font-semibold transition-colors disabled:opacity-40 ${
              isRunning
                ? 'bg-[#3a2222] border border-[#6b3030] text-[#e87070] hover:bg-[#4a2a2a]'
                : 'btn-accent'
            }`}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Weekly chart */}
        <div className="col-span-3 bg-[#252525] border border-[#2e2e2e] rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#e5e7eb]">This Week</h3>
            <Donut val={weekBill} total={weekTotal} label="billable" />
          </div>
          <div className="flex-1">
            <WeekBars data={weekBars} />
          </div>
          <div className="mt-3 pt-3 border-t border-[#2e2e2e]">
            <p className="text-lg font-bold text-[#e5e7eb]">{fmtTime(weekTotal)}</p>
            <p className="text-xs text-[#555]">{fmtTime(weekBill)} billable</p>
          </div>
        </div>

        {/* Projects (wide) */}
        <div className="col-span-6 bg-[#252525] border border-[#2e2e2e] rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#e5e7eb]">Projects</h3>
              <p className="text-xs text-[#555] mt-0.5">{projects.length} active</p>
            </div>
            <a href="/app/projects" className="text-xs text-[#b0c4b1] hover:text-[#c4d5c5] transition-colors">All →</a>
          </div>

          {projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
              <div className="w-12 h-12 bg-[#2a2a2a] rounded-2xl flex items-center justify-center text-[#444] text-xl">+</div>
              <p className="text-sm text-[#555]">No projects yet</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-2">
              {projects.slice(0, 4).map(p => {
                const pb = projBreak.find((x: any) => x.project?.id === p.id || x.project?.name === p.name)
                const pct = pb?.percentage ?? 0
                return (
                  <button key={p.id}
                    onClick={() => { setSelectedProject(p); if (!isRunning) handleStart() }}
                    className="flex items-start gap-3 bg-[#2a2a2a] hover:bg-[#303030] border border-[#333] hover:border-[#b0c4b1]/30 rounded-2xl px-3.5 py-3 transition-all text-left group"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: p.color || '#b0c4b1' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e5e7eb] font-medium truncate">{p.name}</p>
                      <p className="text-xs text-[#555] capitalize mt-0.5">{p.status?.toLowerCase() || 'active'}</p>
                      {pct > 0 && (
                        <div className="mt-1.5 h-0.5 bg-[#333] rounded-full overflow-hidden">
                          <div className="h-full bg-[#b0c4b1] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <span className="text-[#b0c4b1] text-xs opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
"""
(root / "src/app/app/dashboard/page.tsx").write_text(dashboard, encoding="utf-8")
print("dashboard/page.tsx written")
print("All done!")
