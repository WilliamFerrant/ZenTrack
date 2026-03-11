import pathlib, os

root = pathlib.Path(r"c:\web dev\time-tracker")
zen  = root / "src/components/zen"
zen.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# globals.css
# ─────────────────────────────────────────────────────────────────────────────
CSS = """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 10%;
    --foreground: 220 9% 91%;

    --card: 0 0% 14%;
    --card-foreground: 220 9% 91%;

    --popover: 0 0% 14%;
    --popover-foreground: 220 9% 91%;

    --primary: 166 18% 70%;
    --primary-foreground: 0 0% 10%;

    --secondary: 0 0% 100%;
    --secondary-foreground: 220 9% 91%;

    --muted: 220 6% 32%;
    --muted-foreground: 220 8% 65%;

    --accent: 166 18% 70%;
    --accent-foreground: 0 0% 10%;

    --destructive: 0 63% 50%;
    --destructive-foreground: 210 40% 98%;

    --border: 0 0% 100% / 0.06;
    --input: 0 0% 100% / 0.06;
    --ring: 166 18% 70%;

    --radius: 1.25rem;

    --glow: 166 28% 62%;
    --card-sage: 166 20% 82%;

    --sidebar-background: 0 0% 8%;
    --sidebar-foreground: 220 8% 65%;
    --sidebar-primary: 166 18% 70%;
    --sidebar-primary-foreground: 0 0% 10%;
    --sidebar-accent: 0 0% 100% / 0.06;
    --sidebar-accent-foreground: 220 9% 91%;
    --sidebar-border: 0 0% 100% / 0.06;
    --sidebar-ring: 166 18% 70%;
  }
}

@layer base {
  * {
    @apply border-border;
    box-sizing: border-box;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3 {
    text-wrap: balance;
  }

  p, span {
    text-wrap: pretty;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted)) transparent;
  }
}

@layer components {
  .bento-card {
    @apply rounded-3xl border border-border;
    background: hsl(var(--card) / 0.65);
    backdrop-filter: blur(40px) saturate(1.4);
    box-shadow:
      0 0 0 1px hsl(0 0% 100% / 0.04),
      inset 0 1px 0 0 hsl(0 0% 100% / 0.04),
      0 8px 40px -12px rgba(0, 0, 0, 0.5);
  }

  .bento-card-hover {
    @apply bento-card transition-all duration-300 cursor-pointer;
  }

  .bento-card-hover:hover {
    transform: translateY(-3px) scale(1.005);
    box-shadow:
      0 0 0 1px hsl(0 0% 100% / 0.06),
      inset 0 1px 0 0 hsl(0 0% 100% / 0.06),
      0 20px 60px -15px rgba(0, 0, 0, 0.6);
  }

  .bento-sage {
    @apply rounded-3xl border border-border;
    background: hsl(var(--card-sage) / 0.12);
    backdrop-filter: blur(40px) saturate(1.4);
    box-shadow:
      0 0 0 1px hsl(var(--primary) / 0.08),
      inset 0 1px 0 0 hsl(var(--primary) / 0.06),
      0 8px 40px -12px rgba(0, 0, 0, 0.4);
  }

  .tabular-time {
    font-feature-settings: 'tnum';
    font-variant-numeric: tabular-nums;
  }

  .glow-primary {
    box-shadow: 0 0 24px 0 hsl(var(--glow) / 0.22);
  }

  .glow-primary-hover:hover {
    box-shadow: 0 0 36px 0 hsl(var(--glow) / 0.38);
  }

  .input-zen {
    @apply w-full bg-white/5 border border-white/[0.06] text-foreground placeholder:text-muted-foreground
           rounded-xl px-3 py-2.5 text-sm outline-none transition-colors;
  }
  .input-zen:focus {
    @apply border-primary/40;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.08);
  }

  .btn-primary-zen {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium
           bg-primary text-primary-foreground transition-all duration-300
           hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none;
  }

  .btn-ghost-zen {
    @apply inline-flex items-center justify-center gap-2 rounded-xl font-medium
           text-muted-foreground hover:text-foreground hover:bg-white/[0.06]
           transition-all duration-200 active:scale-95;
  }

  .tag {
    @apply px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer;
  }
}
"""
(root / "src/app/globals.css").write_text(CSS, encoding="utf-8")
print("globals.css ✓")

# ─────────────────────────────────────────────────────────────────────────────
# tailwind.config.js
# ─────────────────────────────────────────────────────────────────────────────
TW = r"""/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
"""
(root / "tailwind.config.js").write_text(TW, encoding="utf-8")
print("tailwind.config.js ✓")

# ─────────────────────────────────────────────────────────────────────────────
# AppSidebar.tsx
# ─────────────────────────────────────────────────────────────────────────────
SIDEBAR = r"""// Icon sidebar — 72px wide, fixed left
'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Clock, FolderOpen, BarChart2, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/app/dashboard' },
  { icon: Clock,           label: 'Tracking',  href: '/app/tracking'  },
  { icon: FolderOpen,      label: 'Projects',  href: '/app/projects'  },
  { icon: BarChart2,       label: 'Reports',   href: '/app/reports'   },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await logout(); router.push('/login') } catch {}
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[72px] z-50 flex flex-col items-center py-4 gap-2"
      style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
    >
      {/* Logo */}
      <Link href="/app/dashboard"
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-all hover:scale-105"
        style={{ background: 'hsl(var(--primary))' }}
      >
        <svg className="w-5 h-5" style={{ color: 'hsl(var(--primary-foreground))' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a1 1 0 011 1v6.586l3.707 3.707a1 1 0 01-1.414 1.414l-4-4A1 1 0 0111 13V6a1 1 0 011-1z"/>
        </svg>
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} title={label}
              className="group relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200"
              style={{
                background:  active ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                color:       active ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-foreground))',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--sidebar-accent))' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.6} />
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap
                               rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 20px rgba(0,0,0,.4)' }}
              >{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User avatar + logout */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <button onClick={handleLogout} title="Sign out"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/[0.06]"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          <LogOut size={16} strokeWidth={1.6} />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >
          {user?.first_name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </aside>
  )
}
"""
(zen / "AppSidebar.tsx").write_text(SIDEBAR, encoding="utf-8")
print("AppSidebar.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# TimerCard.tsx
# ─────────────────────────────────────────────────────────────────────────────
TIMER = r"""// Main timer widget
'use client'

import { useTimerStore, useFormattedElapsedTime } from '@/stores'
import { useDataStore } from '@/stores'
import { Play, Square, ChevronDown } from 'lucide-react'

function fmtHMS(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerCard() {
  const {
    isRunning, isStarting, isStopping, elapsedTime,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()
  const { projects } = useDataStore()
  const elapsed = useFormattedElapsedTime()

  const handleStart = async () => {
    try { await startTimer({ project_id: selectedProject?.id, description: description.trim() || undefined }) } catch {}
  }
  const handleStop = async () => {
    try { await stopTimer() } catch {}
  }

  const displayTime = isRunning ? elapsed : fmtHMS(0)

  return (
    <div className="bento-card h-full flex flex-col p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Timer</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRunning
              ? `Tracking · ${selectedProject?.name || 'No project'}`
              : 'Ready to track'}
          </p>
        </div>
        {isRunning && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
            Live
          </div>
        )}
      </div>

      {/* Big clock */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
        <div className="tabular-time font-bold tracking-tight select-none"
          style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', color: isRunning ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
          {displayTime}
        </div>
        {isRunning && selectedProject && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProject.color || 'hsl(var(--primary))' }} />
            {selectedProject.name}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Project */}
        <div className="relative">
          {selectedProject && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedProject.color || 'hsl(var(--primary))' }} />
          )}
          <select
            value={selectedProject?.id ?? ''}
            onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
            className="input-zen appearance-none pr-8"
            style={{ paddingLeft: selectedProject ? '2.25rem' : '0.75rem' }}
          >
            <option value="">Select project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={e => updateDescription(e.target.value)}
          placeholder="What are you working on?"
          className="input-zen"
          onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) handleStart() }}
        />

        {/* Start / Stop */}
        {isRunning ? (
          <button onClick={handleStop} disabled={isStopping}
            className="btn-primary-zen w-full py-3 text-sm glow-primary glow-primary-hover"
            style={{ background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
          >
            <Square size={15} fill="currentColor" />
            {isStopping ? 'Stopping…' : 'Stop Timer'}
          </button>
        ) : (
          <button onClick={handleStart} disabled={isStarting}
            className="btn-primary-zen w-full py-3 text-sm glow-primary glow-primary-hover"
          >
            <Play size={15} fill="currentColor" />
            {isStarting ? 'Starting…' : 'Start Timer'}
          </button>
        )}
      </div>
    </div>
  )
}
"""
(zen / "TimerCard.tsx").write_text(TIMER, encoding="utf-8")
print("TimerCard.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# ProjectsGrid.tsx
# ─────────────────────────────────────────────────────────────────────────────
PROJECTS = r"""// Projects bento grid
'use client'

import { useDataStore, useTimerStore } from '@/stores'
import { FolderOpen, Play, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function fmtHM(sec: number) {
  if (!sec) return '0h'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'text-emerald-400 bg-emerald-400/10',
  ON_HOLD:   'text-amber-400   bg-amber-400/10',
  COMPLETED: 'text-sky-400     bg-sky-400/10',
  ARCHIVED:  'text-muted-foreground bg-white/5',
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, setSelectedProject, startTimer } = useTimerStore()

  const quickStart = async (p: typeof projects[0]) => {
    setSelectedProject(p)
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <div className="bento-card h-full flex flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/app/projects"
          className="btn-ghost-zen px-3 py-1.5 text-xs"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {/* Grid */}
      {isLoadingProjects ? (
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--card))' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'hsl(var(--muted))' }}>
            <FolderOpen size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Link href="/app/projects"
            className="btn-primary-zen px-4 py-2 text-xs"
          >Create project</Link>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
          {projects.slice(0, 6).map(p => (
            <button key={p.id} onClick={() => quickStart(p)}
              className="bento-card-hover relative flex flex-col gap-2.5 p-4 text-left group h-full min-h-[7rem]"
            >
              {/* Quick start icon */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-xl flex items-center justify-center
                              opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-1 group-hover:translate-y-0"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                <Play size={11} fill="currentColor" />
              </div>

              {/* Color + name */}
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || 'hsl(var(--primary))' }} />
                <span className="text-sm font-semibold text-foreground truncate leading-none">{p.name}</span>
              </div>

              {/* Status */}
              <span className={`tag self-start capitalize text-[11px] ${STATUS_STYLE[p.status] || STATUS_STYLE.ACTIVE}`}>
                {p.status?.toLowerCase().replace('_', ' ') || 'active'}
              </span>

              {/* Time tracked */}
              {(p.total_time ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground tabular-time mt-auto">{fmtHM(p.total_time!)}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
"""
(zen / "ProjectsGrid.tsx").write_text(PROJECTS, encoding="utf-8")
print("ProjectsGrid.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# TimeEntries.tsx
# ─────────────────────────────────────────────────────────────────────────────
ENTRIES = r"""// Time entries list
'use client'

import { useState } from 'react'
import { useDataStore } from '@/stores'
import { Clock } from 'lucide-react'

type Period = 'today' | 'week' | 'month' | 'all'

function isToday(v: unknown) {
  const d = v instanceof Date ? v : new Date(String(v))
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}
function isWeek(v: unknown) {
  const d = v instanceof Date ? v : new Date(String(v))
  const s = new Date(); s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0)
  return d >= s
}
function isMonth(v: unknown) {
  const d = v instanceof Date ? v : new Date(String(v))
  const t = new Date()
  return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}
function fmtTime(sec: number) {
  if (!sec) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function fmtClock(v: unknown) {
  try { return (v instanceof Date ? v : new Date(String(v))).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }
  catch { return '' }
}

const TABS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'all',   label: 'All'   },
]

export default function TimeEntries() {
  const [period, setPeriod] = useState<Period>('today')
  const { recentEntries, isLoadingEntries } = useDataStore()

  const entries = recentEntries.filter(e => {
    if (period === 'today') return isToday(e.start_time)
    if (period === 'week')  return isWeek(e.start_time)
    if (period === 'month') return isMonth(e.start_time)
    return true
  })

  return (
    <div className="bento-card h-full flex flex-col p-5">
      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Time Entries</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{entries.length} entries</p>
        </div>
        <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: 'hsl(var(--muted) / 0.4)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setPeriod(t.id)}
              className="tag text-[11px] px-2.5 py-1"
              style={period === t.id
                ? { background: 'hsl(var(--card))', color: 'hsl(var(--primary))', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }
                : { color: 'hsl(var(--muted-foreground))' }
              }
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-0">
        {isLoadingEntries ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted) / 0.3)' }} />
          ))
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'hsl(var(--muted) / 0.4)' }}>
              <Clock size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No entries for this period</p>
          </div>
        ) : entries.map(entry => (
          <div key={entry.id}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-colors group cursor-default"
            style={{ background: 'hsl(var(--card) / 0.5)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card))'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--card) / 0.5)'}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate leading-none">
                {entry.description || (entry as any).project?.name || 'No description'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {(entry as any).project?.name || '—'} · {fmtClock(entry.start_time)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {entry.is_billable && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.1)' }}>$</span>
              )}
              <span className="text-xs font-mono text-muted-foreground tabular-time">{fmtTime(entry.duration)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
"""
(zen / "TimeEntries.tsx").write_text(ENTRIES, encoding="utf-8")
print("TimeEntries.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# DailySummary.tsx
# ─────────────────────────────────────────────────────────────────────────────
DAILY = r"""// Daily summary — sage-tinted bento card
'use client'

import { useDataStore } from '@/stores'
import { TrendingUp } from 'lucide-react'

function fmtHM(sec: number) {
  if (!sec) return '0h 0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${m}m`
}

export default function DailySummary() {
  const { dashboardSummary, isLoadingDashboard } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const nEntries = dashboardSummary?.totals?.total_entries ?? 0
  const goalPct  = Math.min(Math.round((total / (8 * 3600)) * 100), 100)
  const billPct  = total > 0 ? Math.round((billable / total) * 100) : 0

  if (isLoadingDashboard) {
    return <div className="bento-sage p-5 h-36 animate-pulse rounded-3xl" />
  }

  return (
    <div className="bento-sage p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Today</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{nEntries} {nEntries === 1 ? 'entry' : 'entries'}</p>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
          <TrendingUp size={15} strokeWidth={2} />
        </div>
      </div>

      {/* Big time */}
      <p className="text-3xl font-bold tabular-time text-foreground leading-none mb-3">
        {fmtHM(total)}
      </p>

      {/* Stats row */}
      <div className="flex gap-3 text-xs">
        <div className="flex-1">
          <p className="text-muted-foreground mb-1">Billable</p>
          <p className="font-semibold tabular-time" style={{ color: 'hsl(var(--primary))' }}>
            {fmtHM(billable)} <span className="text-muted-foreground font-normal">({billPct}%)</span>
          </p>
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground mb-1">Goal</p>
          <p className="font-semibold" style={{ color: goalPct >= 100 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
            {goalPct}%
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${goalPct}%`, background: 'hsl(var(--primary))' }} />
      </div>
    </div>
  )
}
"""
(zen / "DailySummary.tsx").write_text(DAILY, encoding="utf-8")
print("DailySummary.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# WeekStats.tsx  (replaces NowPlaying)
# ─────────────────────────────────────────────────────────────────────────────
WEEK = r"""// Weekly stats bar chart
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

function fmtHM(sec: number) {
  if (!sec) return '0h'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h` : `${m}m`
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function WeekStats() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get<any>('/dashboard/summary?period=week').then(setData).catch(() => {})
  }, [])

  const bars: Array<{ date: string; total_time: number }> = data?.daily_breakdown ?? []
  const weekTotal = data?.totals?.total_time ?? 0
  const billable  = data?.totals?.billable_time ?? 0
  const max = Math.max(...bars.map(b => b.total_time), 1)
  const todayIdx = (new Date().getDay() + 6) % 7 // Mon=0

  return (
    <div className="bento-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">This Week</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{fmtHM(billable)} billable</p>
        </div>
        <p className="text-xl font-bold tabular-time text-foreground">{fmtHM(weekTotal)}</p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-14">
        {DAY_LABELS.map((d, i) => {
          const entry = bars[i]
          const h = entry ? (entry.total_time / max) * 100 : 0
          const isToday = i === todayIdx
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full rounded-sm transition-all duration-500"
                style={{
                  height: `${Math.max(h, 3)}%`,
                  background: isToday
                    ? 'hsl(var(--primary))'
                    : h > 0 ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--muted) / 0.4)',
                  minHeight: '3px',
                }} />
              <span className="text-[9px]"
                style={{ color: isToday ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)' }}>
                {d}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
"""
(zen / "WeekStats.tsx").write_text(WEEK, encoding="utf-8")
print("WeekStats.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# QuickActions.tsx
# ─────────────────────────────────────────────────────────────────────────────
QUICK = r"""// Quick actions panel
'use client'

import { useRouter } from 'next/navigation'
import { useTimerStore, useDataStore } from '@/stores'
import { Play, Square, FolderPlus, BarChart2, Clock } from 'lucide-react'

function fmtHM(sec: number) {
  if (!sec) return '0h 0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${m}m`
}

export default function QuickActions() {
  const router = useRouter()
  const {
    isRunning, isStarting, isStopping, currentTimer, elapsedTime,
    startTimer, stopTimer,
  } = useTimerStore()
  const { dashboardSummary, projects } = useDataStore()

  const handleToggleTimer = async () => {
    try { isRunning ? await stopTimer() : await startTimer() } catch {}
  }

  const totalToday = dashboardSummary?.totals?.total_time ?? 0

  return (
    <div className="bento-card p-5 flex flex-col gap-4 h-full">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Shortcuts</p>
      </div>

      {/* Active timer status */}
      {isRunning && currentTimer && (
        <div className="rounded-2xl p-3 flex flex-col gap-1"
          style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(var(--primary))' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
            Timer running
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {currentTimer.description || currentTimer.project?.name || 'No description'}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <button onClick={handleToggleTimer} disabled={isStarting || isStopping}
          className={`btn-primary-zen w-full py-3 text-sm glow-primary glow-primary-hover ${
            isRunning ? 'bg-destructive text-destructive-foreground' : ''
          }`}
          style={isRunning ? { background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' } : {}}
        >
          {isRunning
            ? <><Square size={14} fill="currentColor" /> {isStopping ? 'Stopping…' : 'Stop Timer'}</>
            : <><Play size={14} fill="currentColor" /> {isStarting ? 'Starting…' : 'Start Timer'}</>
          }
        </button>

        <button onClick={() => router.push('/app/tracking')}
          className="btn-ghost-zen w-full py-2.5 text-sm justify-start gap-3 px-3"
          style={{ background: 'hsl(var(--card) / 0.5)', borderRadius: '0.875rem' }}
        >
          <Clock size={15} /> Tracking page
        </button>

        <button onClick={() => router.push('/app/projects')}
          className="btn-ghost-zen w-full py-2.5 text-sm justify-start gap-3 px-3"
          style={{ background: 'hsl(var(--card) / 0.5)', borderRadius: '0.875rem' }}
        >
          <FolderPlus size={15} /> New project
        </button>

        <button onClick={() => router.push('/app/reports')}
          className="btn-ghost-zen w-full py-2.5 text-sm justify-start gap-3 px-3"
          style={{ background: 'hsl(var(--card) / 0.5)', borderRadius: '0.875rem' }}
        >
          <BarChart2 size={15} /> Reports
        </button>
      </div>

      {/* Today mini stat */}
      <div className="mt-auto pt-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <p className="text-xs text-muted-foreground">Today</p>
        <p className="text-2xl font-bold tabular-time text-foreground mt-0.5">{fmtHM(totalToday)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{projects.length} projects</p>
      </div>
    </div>
  )
}
"""
(zen / "QuickActions.tsx").write_text(QUICK, encoding="utf-8")
print("QuickActions.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# AppLayout.tsx  — sidebar + content
# ─────────────────────────────────────────────────────────────────────────────
LAYOUT = r"""// App layout with sidebar
'use client'

import { ReactNode, useEffect } from 'react'
import AppSidebar from '../zen/AppSidebar'
import { ToastContainer } from '../ui/ToastContainer'
import { ModalContainer } from '../ui/ModalContainer'
import { NetworkStatusIndicator } from '../ui/NetworkStatusIndicator'
import { useAppInitialization } from '@/stores'

export interface AppLayoutProps {
  children: ReactNode
  title?: string
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, initializeApp } = useAppInitialization()

  useEffect(() => {
    if (isAuthenticated) initializeApp().catch(console.error)
  }, [isAuthenticated, initializeApp])

  return (
    <div className="min-h-svh flex bg-background">
      <AppSidebar />
      <main className="flex-1 ml-[72px] p-3 lg:p-4 overflow-y-auto">
        {children}
      </main>
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}
"""
(root / "src/components/layout/AppLayout.tsx").write_text(LAYOUT, encoding="utf-8")
print("AppLayout.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# Dashboard page
# ─────────────────────────────────────────────────────────────────────────────
DASHBOARD = r"""// Dashboard — bento grid layout
'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'
import QuickActions from '@/components/zen/QuickActions'
import TimerCard from '@/components/zen/TimerCard'
import DailySummary from '@/components/zen/DailySummary'
import WeekStats from '@/components/zen/WeekStats'
import ProjectsGrid from '@/components/zen/ProjectsGrid'
import TimeEntries from '@/components/zen/TimeEntries'

export default function DashboardPage() {
  const { fetchRecentEntries, fetchProjects, fetchDashboardSummary } = useDataStore()
  const { isRunning, startTimer } = useTimerStore()

  useEffect(() => {
    fetchRecentEntries(50)
    fetchProjects()
    fetchDashboardSummary('day')
  }, []) // eslint-disable-line

  return (
    <>
      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-3 lg:gap-4 auto-rows-min max-w-[1600px] mx-auto">

        {/* Row 1 */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 lg:gap-4" style={{ minHeight: '420px' }}>
          <QuickActions />
        </div>

        <div className="col-span-12 lg:col-span-5" style={{ minHeight: '420px' }}>
          <TimerCard />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:gap-4">
          <DailySummary />
          <WeekStats />
        </div>

        {/* Row 2 */}
        <div className="col-span-12 lg:col-span-7" style={{ minHeight: '360px' }}>
          <ProjectsGrid />
        </div>

        <div className="col-span-12 lg:col-span-5" style={{ minHeight: '360px' }}>
          <TimeEntries />
        </div>

      </div>

      {/* Floating action button */}
      <button
        onClick={() => { if (!isRunning) startTimer().catch(() => {}) }}
        className="fixed bottom-6 right-6 h-12 px-5 flex items-center justify-center gap-2 rounded-full
                   bg-primary text-primary-foreground font-medium glow-primary glow-primary-hover
                   transition-all duration-300 hover:-translate-y-1 active:scale-95 z-50 text-sm"
      >
        <Plus size={18} />
        New Timer
      </button>
    </>
  )
}
"""
(root / "src/app/app/dashboard/page.tsx").write_text(DASHBOARD, encoding="utf-8")
print("dashboard/page.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# Update login page to use dark background in line with new theme
# ─────────────────────────────────────────────────────────────────────────────
LOGIN_PATH = root / "src/app/login/page.tsx"
if LOGIN_PATH.exists():
    content = LOGIN_PATH.read_text(encoding="utf-8")
    content = content.replace('bg-gray-50', 'bg-background')
    content = content.replace('bg-gray-100', 'bg-background')
    content = content.replace('className="min-h-screen flex', 'className="min-h-screen flex bg-background')
    content = content.replace('bg-white shadow rounded-lg', 'bento-card')
    content = content.replace('bg-white shadow-md rounded-lg', 'bento-card')
    content = content.replace('text-gray-900', 'text-foreground')
    content = content.replace('text-gray-600', 'text-muted-foreground')
    content = content.replace('text-gray-500', 'text-muted-foreground')
    content = content.replace('text-gray-700', 'text-foreground')
    # input fields
    content = content.replace(
        'border border-gray-300 rounded-md',
        'border border-white/[0.06] rounded-xl'
    )
    content = content.replace('bg-blue-600 hover:bg-blue-700', 'bg-primary hover:bg-primary/90')
    content = content.replace(
        'focus:ring-blue-500',
        'focus:ring-primary'
    )
    LOGIN_PATH.write_text(content, encoding="utf-8")
    print("login/page.tsx ✓")

print("\nAll done!")
