import pathlib

root = pathlib.Path(r"c:\web dev\time-tracker")
zen  = root / "src/components/zen"

# ─────────────────────────────────────────────────────────────────────────────
# AppSidebar — stacked icon + label (matches reference screenshot 1)
# ─────────────────────────────────────────────────────────────────────────────
SIDEBAR = r"""'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FolderOpen, Clock, BarChart2, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/app/dashboard' },
  { icon: FolderOpen,      label: 'Projects',  href: '/app/projects'  },
  { icon: Clock,           label: 'Timer',     href: '/app/tracking'  },
  { icon: BarChart2,       label: 'Reports',   href: '/app/reports'   },
  { icon: Settings,        label: 'Settings',  href: '/app/settings'  },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await logout(); router.push('/login') } catch {}
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full w-[72px] z-50 flex flex-col items-center py-4"
      style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
    >
      {/* Logo */}
      <Link href="/app/dashboard"
        className="w-9 h-9 rounded-2xl flex items-center justify-center mb-6 font-bold text-sm transition-all hover:scale-105 select-none"
        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
      >ZT</Link>

      {/* Nav — icon on top, label below, stacked */}
      <nav className="flex flex-col items-center gap-0.5 flex-1 w-full px-2">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center gap-1 w-full py-2.5 rounded-2xl transition-all duration-200 select-none"
              style={{
                background: active ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                color: active ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-foreground))',
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
              <span style={{
                fontSize: '9px',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer: logout + avatar */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <button onClick={handleLogout} title="Sign out"
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ color: 'hsl(var(--sidebar-foreground))' }}
        >
          <LogOut size={15} strokeWidth={1.6} />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold select-none"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        >{user?.first_name?.[0]?.toUpperCase() || 'U'}</div>
      </div>
    </aside>
  )
}
"""
(zen / "AppSidebar.tsx").write_text(SIDEBAR, encoding="utf-8")
print("AppSidebar.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# TimerCard — circular arc ring + big clock (THE key missing piece)
# ─────────────────────────────────────────────────────────────────────────────
TIMER = r"""'use client'

import { useTimerStore, useDataStore } from '@/stores'
import { Play, Square, ChevronDown } from 'lucide-react'

// H:MM:SS — no leading zero on hours
function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function CircleRing({
  isRunning, pct, onToggle, isLoading,
}: {
  isRunning: boolean; pct: number; onToggle: () => void; isLoading: boolean
}) {
  const r = 100, cx = 120, cy = 120
  const circ = 2 * Math.PI * r   // ≈ 628.3

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: 240, height: 240 }}>
      {/* SVG — track + progress arcs */}
      <svg width="240" height="240" viewBox="0 0 240 240" className="absolute inset-0">
        {/* Outer subtle ring */}
        <circle cx={cx} cy={cy} r={r + 14} fill="none"
          stroke="hsl(var(--muted) / 0.08)" strokeWidth="1" />
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="hsl(var(--muted) / 0.22)" strokeWidth="12" />
        {/* Inner body */}
        <circle cx={cx} cy={cy} r="82" fill="hsl(var(--card))" />
        {/* Progress arc */}
        {pct > 0.002 && (
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="hsl(var(--primary))" strokeWidth="12"
            strokeDasharray={`${pct * circ} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        )}
        {/* Glow dot at tip when running */}
        {isRunning && pct > 0.01 && (() => {
          const angle = -Math.PI / 2 + pct * 2 * Math.PI
          const tx = cx + r * Math.cos(angle)
          const ty = cy + r * Math.sin(angle)
          return <circle cx={tx} cy={ty} r="5" fill="hsl(var(--primary))" opacity="0.8" />
        })()}
      </svg>

      {/* Centered play/stop button */}
      <button
        onClick={onToggle}
        disabled={isLoading}
        className="relative z-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40"
        style={{
          width: 72, height: 72,
          background: isRunning
            ? 'hsl(var(--destructive) / 0.15)'
            : 'hsl(var(--primary) / 0.14)',
          border: `1.5px solid ${isRunning ? 'hsl(var(--destructive) / 0.35)' : 'hsl(var(--primary) / 0.35)'}`,
          color: isRunning ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
          boxShadow: isRunning
            ? '0 0 32px hsl(var(--destructive) / 0.12)'
            : '0 0 32px hsl(var(--glow) / 0.18)',
        }}
      >
        {isRunning
          ? <Square size={24} strokeWidth={2} />
          : <Play size={26} fill="currentColor" strokeWidth={0} style={{ marginLeft: 4 }} />
        }
      </button>
    </div>
  )
}

export default function TimerCard() {
  const {
    isRunning, isStarting, isStopping, elapsedTime,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()
  const { projects } = useDataStore()

  const toggle = async () => {
    try {
      isRunning
        ? await stopTimer()
        : await startTimer({ project_id: selectedProject?.id, description: description.trim() || undefined })
    } catch {}
  }

  // Arc fills based on elapsed vs 8h goal
  const pct = Math.min(elapsedTime / (8 * 3600), 1)

  return (
    <div className="bento-card h-full flex flex-col p-6 gap-3">
      {/* Status header */}
      <div className="text-center pb-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
          {isRunning ? 'Live Timer' : 'Timer'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRunning ? (selectedProject?.name || 'Tracking…') : 'Ready to track'}
        </p>
      </div>

      {/* Circle ring */}
      <CircleRing
        isRunning={isRunning}
        pct={pct}
        onToggle={toggle}
        isLoading={isStarting || isStopping}
      />

      {/* Big clock */}
      <div className="text-center -mt-1">
        <p className="tabular-time font-bold text-foreground leading-none select-none"
          style={{ fontSize: 'clamp(3.5rem, 7vw, 6rem)' }}>
          {fmtClock(elapsedTime)}
        </p>
      </div>

      {/* Description — underline style */}
      <div className="relative mt-1">
        <input
          type="text"
          value={description}
          onChange={e => updateDescription(e.target.value)}
          placeholder="What are you working on?"
          className="w-full bg-transparent border-0 border-b pb-2 text-center text-sm
                     text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
          style={{
            borderColor: 'hsl(var(--border))',
            caretColor: 'hsl(var(--primary))',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
          onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggle() }}
        />
      </div>

      {/* Project selector */}
      <div className="flex justify-center mt-1">
        {selectedProject ? (
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProject.color }} />
            {selectedProject.name}
            <span className="opacity-60 ml-0.5">×</span>
          </button>
        ) : (
          <div className="relative">
            <select
              value=""
              onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
              className="bg-transparent text-center text-xs text-muted-foreground focus:outline-none
                         appearance-none pr-4 cursor-pointer"
            >
              <option value="" disabled>Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}
"""
(zen / "TimerCard.tsx").write_text(TIMER, encoding="utf-8")
print("TimerCard.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# QuickActions — 2×2 mode cards + DND toggle (matches reference)
# ─────────────────────────────────────────────────────────────────────────────
QUICK = r"""'use client'

import { useState } from 'react'
import { Monitor, Users, Coffee, Moon, Bell, BellOff } from 'lucide-react'
import { useTimerStore, useDataStore } from '@/stores'

const MODES = [
  { icon: Monitor, label: 'Focus Mode',  desc: 'Deep work',  tag: 'Deep focus session' },
  { icon: Users,   label: 'Meeting',     desc: 'Calls',      tag: 'Team meeting'        },
  { icon: Coffee,  label: 'Break Time',  desc: 'Relax',      tag: 'Short break'         },
  { icon: Moon,    label: 'Wind Down',   desc: 'End of day', tag: 'Daily review'        },
]

export default function QuickActions() {
  const [dnd, setDnd] = useState(false)
  const { isRunning, isStarting, selectedProject, updateDescription, startTimer } = useTimerStore()
  const { dashboardSummary } = useDataStore()

  const handleMode = async (tag: string) => {
    if (isRunning || isStarting) return
    updateDescription(tag)
    try { await startTimer({ description: tag, project_id: selectedProject?.id }) } catch {}
  }

  return (
    <div className="bento-card h-full flex flex-col p-5 gap-3">
      {/* 2×2 action cards */}
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {MODES.map(({ icon: Icon, label, desc, tag }) => (
          <button key={label} onClick={() => handleMode(tag)}
            className="bento-card-hover flex flex-col items-start gap-3 p-4 text-left"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))' }}
            >
              <Icon size={16} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Do Not Disturb toggle card */}
      <div className="bento-card flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))' }}
          >
            {dnd ? <BellOff size={14} strokeWidth={1.7} /> : <Bell size={14} strokeWidth={1.7} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Do Not Disturb</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Notifications {dnd ? 'paused' : 'active'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button onClick={() => setDnd(!dnd)}
          className="relative flex-shrink-0 rounded-full transition-colors duration-200"
          style={{
            width: 44, height: 24,
            background: dnd ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.6)',
          }}
        >
          <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full shadow-sm transition-all duration-200"
            style={{
              left: dnd ? '23px' : '3px',
              background: dnd ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground) / 0.7)',
            }}
          />
        </button>
      </div>
    </div>
  )
}
"""
(zen / "QuickActions.tsx").write_text(QUICK, encoding="utf-8")
print("QuickActions.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# ProjectsGrid — 3-col rows with circular arc progress per project
# ─────────────────────────────────────────────────────────────────────────────
PROJECTS = r"""'use client'

import { useDataStore, useTimerStore } from '@/stores'
import { FolderOpen, Play } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '@/types'

function fmtHM(sec: number) {
  if (!sec) return '0h 00m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function ProjectArc({ color, pct }: { color: string; pct: number }) {
  const r = 15
  const circ = 2 * Math.PI * r  // ≈ 94.25
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="flex-shrink-0">
      <circle cx="20" cy="20" r={r} fill="none"
        stroke="hsl(var(--muted) / 0.28)" strokeWidth="3.5" />
      {pct > 0.01 && (
        <circle cx="20" cy="20" r={r} fill="none"
          stroke={color || 'hsl(var(--primary))'} strokeWidth="3.5"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      )}
    </svg>
  )
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, setSelectedProject, startTimer } = useTimerStore()

  const maxTime = Math.max(...projects.map(p => p.total_time ?? 0), 1)

  const quickStart = async (p: Project) => {
    setSelectedProject(p)
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <div className="bento-card h-full flex flex-col p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
          Projects
        </p>
        <Link href="/app/projects"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all →
        </Link>
      </div>

      {isLoadingProjects ? (
        <div className="flex-1 grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse"
              style={{ background: 'hsl(var(--muted) / 0.2)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'hsl(var(--muted) / 0.4)' }}>
            <FolderOpen size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Link href="/app/projects" className="btn-primary-zen px-4 py-2 text-xs">
            Create project
          </Link>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-0 content-start">
          {projects.slice(0, 6).map((p, i) => {
            const pct = (p.total_time ?? 0) / maxTime
            const isLast = i >= projects.slice(0, 6).length - 3
            return (
              <div key={p.id}
                className="flex items-center gap-3 py-2.5 group"
                style={{ borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))' }}
              >
                <ProjectArc color={p.color || 'hsl(var(--primary))'} pct={pct} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-none">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-time mt-0.5">
                    {fmtHM(p.total_time ?? 0)}
                  </p>
                </div>
                <button onClick={() => quickStart(p)}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                             opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                  style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                >
                  <Play size={10} fill="currentColor" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
"""
(zen / "ProjectsGrid.tsx").write_text(PROJECTS, encoding="utf-8")
print("ProjectsGrid.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# TimeEntries — description + project + start time + HH:MM:SS duration
# ─────────────────────────────────────────────────────────────────────────────
ENTRIES = r"""'use client'

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

// HH:MM:SS like "1:10:23"
function fmtHMS(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtClock(v: unknown) {
  try {
    return (v instanceof Date ? v : new Date(String(v)))
      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '' }
}

const TAB_LABELS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'Week'  },
  { id: 'month', label: 'Month' },
  { id: 'all',   label: 'All'   },
]

const HEADER_LABELS: Record<Period, string> = {
  today: "Today's Entries",
  week:  'This Week',
  month: 'This Month',
  all:   'All Entries',
}

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            {HEADER_LABELS[period]}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{entries.length} entries</p>
        </div>
        {/* Tab pills */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: 'hsl(var(--muted) / 0.25)' }}>
          {TAB_LABELS.map(t => (
            <button key={t.id} onClick={() => setPeriod(t.id)}
              className="tag text-[11px] px-2.5 py-1 transition-all"
              style={period === t.id
                ? { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 1px 4px rgba(0,0,0,.3)' }
                : { color: 'hsl(var(--muted-foreground))' }
              }
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoadingEntries ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse my-1"
                style={{ background: 'hsl(var(--muted) / 0.2)' }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'hsl(var(--muted) / 0.4)' }}>
              <Clock size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No entries for this period</p>
          </div>
        ) : (
          <div>
            {entries.map((entry, i) => (
              <div key={entry.id}
                className="flex items-center justify-between py-3 group"
                style={{ borderBottom: i < entries.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
              >
                {/* Left: description + project */}
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-foreground truncate leading-none">
                    {entry.description || 'Untitled entry'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }} />
                    <p className="text-[11px] text-muted-foreground truncate">
                      {(entry as any).project?.name || '—'}
                    </p>
                  </div>
                </div>
                {/* Right: start time + duration */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <p className="text-[11px] text-muted-foreground tabular-time hidden sm:block">
                    {fmtClock(entry.start_time)}
                  </p>
                  <p className="text-sm font-semibold tabular-time"
                    style={{ color: 'hsl(var(--primary))' }}>
                    {fmtHMS(entry.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
"""
(zen / "TimeEntries.tsx").write_text(ENTRIES, encoding="utf-8")
print("TimeEntries.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# DailySummary — TODAY card with big time, billable arc, streak
# ─────────────────────────────────────────────────────────────────────────────
DAILY = r"""'use client'

import { useMemo } from 'react'
import { useDataStore } from '@/stores'
import { Zap } from 'lucide-react'

function fmtHM(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

// Small ring for the billable % stat
function MiniRing({ pct, size = 32 }: { pct: number; size?: number }) {
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(var(--primary) / 0.2)" strokeWidth="3" />
      {pct > 0 && (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="3"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }} />
      )}
    </svg>
  )
}

export default function DailySummary() {
  const { dashboardSummary, recentEntries, isLoadingDashboard } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const goalPct  = Math.min((total / (8 * 3600)), 1)
  const billPct  = total > 0 ? Math.round((billable / total) * 100) : 0

  // Streak: consecutive days with at least one entry
  const streak = useMemo(() => {
    const seen = new Set(recentEntries.map(e => {
      const d = new Date(e.start_time instanceof Date ? e.start_time : String(e.start_time))
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))
    let count = 0
    const d = new Date()
    while (count < 365) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!seen.has(key)) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [recentEntries])

  if (isLoadingDashboard) {
    return <div className="bento-card animate-pulse rounded-3xl" style={{ height: 160 }} />
  }

  return (
    <div className="bento-card p-5 flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Today</p>

      {/* Big time */}
      <div>
        <p className="text-3xl font-bold tabular-time text-foreground leading-none">
          {fmtHM(total)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Total tracked</p>
      </div>

      {/* Stats row: billable circle + streak */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <MiniRing pct={billPct / 100} size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tabular-time">{billPct}%</p>
            <p className="text-[10px] text-muted-foreground">Billable</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            <Zap size={14} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{streak} days</p>
            <p className="text-[10px] text-muted-foreground">Streak</p>
          </div>
        </div>
      </div>

      {/* Goal progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Daily goal</span>
          <span className="tabular-time">{Math.round(goalPct * 100)}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.3)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${goalPct * 100}%`, background: 'hsl(var(--primary))' }} />
        </div>
      </div>
    </div>
  )
}
"""
(zen / "DailySummary.tsx").write_text(DAILY, encoding="utf-8")
print("DailySummary.tsx ✓")

# ─────────────────────────────────────────────────────────────────────────────
# WeekStats — bar chart (bottom of right column)
# ─────────────────────────────────────────────────────────────────────────────
WEEK = r"""'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

function fmtH(sec: number) {
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
  const weekTotal  = data?.totals?.total_time    ?? 0
  const billable   = data?.totals?.billable_time ?? 0
  const max        = Math.max(...bars.map(b => b.total_time), 1)
  const todayIdx   = (new Date().getDay() + 6) % 7   // Mon=0

  return (
    <div className="bento-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
            This Week
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{fmtH(billable)} billable</p>
        </div>
        <p className="text-xl font-bold tabular-time text-foreground">{fmtH(weekTotal)}</p>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-14">
        {DAY_LABELS.map((d, i) => {
          const entry = bars[i]
          const pct   = entry ? (entry.total_time / max) * 100 : 0
          const today = i === todayIdx
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full rounded-sm transition-all duration-500"
                style={{
                  height: `${Math.max(pct, 4)}%`,
                  background: today
                    ? 'hsl(var(--primary))'
                    : pct > 0 ? 'hsl(var(--primary) / 0.28)' : 'hsl(var(--muted) / 0.3)',
                  minHeight: '3px',
                }} />
              <span className="text-[9px]"
                style={{ color: today ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.5)' }}>
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
# globals.css — refine bento-card: more blur, softer shadow, smoother feel
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
  *, *::before, *::after { box-sizing: border-box; }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted) / 0.4) transparent;
  }
}

@layer components {
  /* ── Bento cards ───────────────────────────────────────────────────── */
  .bento-card {
    @apply rounded-3xl;
    background: hsl(var(--card) / 0.7);
    border: 1px solid hsl(0 0% 100% / 0.055);
    backdrop-filter: blur(48px) saturate(1.3);
    box-shadow:
      0 0 0 1px hsl(0 0% 100% / 0.035),
      inset 0 1px 0 0 hsl(0 0% 100% / 0.04),
      0 8px 40px -12px rgba(0, 0, 0, 0.55);
  }

  .bento-card-hover {
    @apply bento-card transition-all duration-300 cursor-pointer;
  }
  .bento-card-hover:hover {
    transform: translateY(-2px) scale(1.004);
    border-color: hsl(0 0% 100% / 0.09);
    box-shadow:
      0 0 0 1px hsl(0 0% 100% / 0.06),
      inset 0 1px 0 0 hsl(0 0% 100% / 0.06),
      0 20px 60px -15px rgba(0, 0, 0, 0.65);
  }

  .bento-sage {
    @apply rounded-3xl;
    background: hsl(var(--card-sage) / 0.1);
    border: 1px solid hsl(var(--primary) / 0.12);
    backdrop-filter: blur(48px) saturate(1.4);
    box-shadow:
      0 0 0 1px hsl(var(--primary) / 0.06),
      inset 0 1px 0 0 hsl(var(--primary) / 0.05),
      0 8px 40px -12px rgba(0, 0, 0, 0.4);
  }

  /* ── Utilities ─────────────────────────────────────────────────────── */
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

  /* ── Form elements ─────────────────────────────────────────────────── */
  .input-zen {
    @apply w-full bg-white/[0.05] border text-foreground placeholder:text-muted-foreground
           rounded-xl px-3 py-2.5 text-sm outline-none transition-colors;
    border-color: hsl(var(--border));
  }
  .input-zen:focus {
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.08);
  }

  /* ── Buttons ───────────────────────────────────────────────────────── */
  .btn-primary-zen {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl font-medium
           bg-primary text-primary-foreground transition-all duration-300
           hover:-translate-y-0.5 active:scale-[0.97]
           disabled:opacity-40 disabled:pointer-events-none;
  }
  .btn-ghost-zen {
    @apply inline-flex items-center justify-center gap-2 rounded-xl font-medium
           text-muted-foreground hover:text-foreground hover:bg-white/[0.06]
           transition-all duration-200 active:scale-95;
  }

  /* ── Tag / pill ────────────────────────────────────────────────────── */
  .tag {
    @apply px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer;
  }
}
"""
(root / "src/app/globals.css").write_text(CSS, encoding="utf-8")
print("globals.css ✓")

# ─────────────────────────────────────────────────────────────────────────────
# Dashboard page — same structure, no changes (already correct layout)
# ─────────────────────────────────────────────────────────────────────────────
DASHBOARD = r"""'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'
import QuickActions from '@/components/zen/QuickActions'
import TimerCard    from '@/components/zen/TimerCard'
import DailySummary from '@/components/zen/DailySummary'
import WeekStats    from '@/components/zen/WeekStats'
import ProjectsGrid from '@/components/zen/ProjectsGrid'
import TimeEntries  from '@/components/zen/TimeEntries'

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
      <div className="grid grid-cols-12 gap-3 lg:gap-4 auto-rows-min max-w-[1600px] mx-auto">

        {/* Row 1 */}
        <div className="col-span-12 lg:col-span-3" style={{ minHeight: 420 }}>
          <QuickActions />
        </div>

        <div className="col-span-12 lg:col-span-5" style={{ minHeight: 420 }}>
          <TimerCard />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:gap-4">
          <DailySummary />
          <WeekStats />
        </div>

        {/* Row 2 */}
        <div className="col-span-12 lg:col-span-7" style={{ minHeight: 340 }}>
          <ProjectsGrid />
        </div>

        <div className="col-span-12 lg:col-span-5" style={{ minHeight: 340 }}>
          <TimeEntries />
        </div>

      </div>

      {/* Floating action button */}
      <button
        onClick={() => { if (!isRunning) startTimer().catch(() => {}) }}
        className="fixed bottom-6 right-6 h-12 px-5 flex items-center justify-center gap-2
                   rounded-full bg-primary text-primary-foreground font-medium
                   glow-primary glow-primary-hover transition-all duration-300
                   hover:-translate-y-1 active:scale-95 z-50 text-sm"
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

print("\nAll components written!")
