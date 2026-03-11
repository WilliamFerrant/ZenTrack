import pathlib

root = pathlib.Path(r"c:\web dev\time-tracker")
zen  = root / "src/components/zen"
zen.mkdir(parents=True, exist_ok=True)

# ─── globals.css — exact CSS vars from zen-flow reference ────────────────────
(root / "src/app/globals.css").write_text(r"""@tailwind base;
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

  .glass-card {
    @apply bento-card;
  }
  .glass-card-hover {
    @apply bento-card-hover;
  }

  .tabular-time {
    font-feature-settings: 'tnum';
    font-variant-numeric: tabular-nums;
  }

  .glow-primary {
    box-shadow: 0 0 24px 0 hsl(var(--glow) / 0.2);
  }
  .glow-primary-hover:hover {
    box-shadow: 0 0 36px 0 hsl(var(--glow) / 0.35);
  }
}
""", encoding="utf-8")
print("globals.css ✓")

# ─── tailwind.config.js ───────────────────────────────────────────────────────
(root / "tailwind.config.js").write_text(r"""/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glow:       "hsl(var(--glow))",
        "card-sage":"hsl(var(--card-sage))",
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
""", encoding="utf-8")
print("tailwind.config.js ✓")

# ─── AppSidebar — fixed 72px, icon + label stacked ───────────────────────────
(zen / "AppSidebar.tsx").write_text("""'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, FolderOpen, Timer, BarChart2, Clock, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores'

const NAV = [
  { icon: LayoutGrid, label: 'Dashboard', href: '/app/dashboard' },
  { icon: FolderOpen, label: 'Projects',  href: '/app/projects'  },
  { icon: Timer,      label: 'Timer',     href: '/app/tracking'  },
  { icon: BarChart2,  label: 'Reports',   href: '/app/reports'   },
  { icon: Clock,      label: 'History',   href: '/app/reports'   },
  { icon: Settings,   label: 'Settings',  href: '/app/settings'  },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  const initial = (user?.first_name?.[0] ?? 'U').toUpperCase()

  const handleLogout = async () => {
    try { await logout(); router.push('/login') } catch {}
  }

  return (
    <nav
      className="fixed top-0 left-0 h-full w-[72px] flex flex-col items-center py-5 gap-6 z-50"
      style={{
        background: 'hsl(var(--sidebar-background))',
        borderRight: '1px solid hsl(0 0% 100% / 0.06)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => router.push('/app/dashboard')}
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-opacity hover:opacity-80"
        style={{ background: 'hsl(var(--primary) / 0.15)' }}
      >
        <span className="text-primary font-bold text-sm">ZT</span>
      </button>

      {/* Nav items */}
      <div className="flex flex-col gap-1 w-full px-2">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (pathname.startsWith(href + '/') && href !== '/app/reports')
          return (
            <button
              key={label}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full py-2.5 rounded-2xl transition-all duration-200 ${
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
              }`}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[9px] font-medium mt-0.5">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Bottom: avatar + logout */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={handleLogout}
          title="Sign out"
          className="w-9 h-9 rounded-full flex items-center justify-center text-primary text-xs font-semibold transition-opacity hover:opacity-80"
          style={{
            background: 'hsl(var(--primary) / 0.2)',
            boxShadow: '0 0 0 2px hsl(var(--primary) / 0.1)',
          }}
        >
          {initial}
        </button>
      </div>
    </nav>
  )
}
""", encoding="utf-8")
print("AppSidebar.tsx ✓")

# ─── AppLayout — ml-[72px], no topbar ────────────────────────────────────────
(root / "src/components/layout/AppLayout.tsx").write_text("""'use client'

import { ReactNode, useEffect } from 'react'
import AppSidebar from '../zen/AppSidebar'
import { ToastContainer } from '../ui/ToastContainer'
import { ModalContainer } from '../ui/ModalContainer'
import { NetworkStatusIndicator } from '../ui/NetworkStatusIndicator'
import { useAppInitialization } from '@/stores'

export interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, initializeApp } = useAppInitialization()

  useEffect(() => {
    if (isAuthenticated) initializeApp().catch(console.error)
  }, [isAuthenticated, initializeApp])

  return (
    <div className="min-h-svh flex bg-background">
      <AppSidebar />
      <main className="flex-1 ml-[72px] overflow-y-auto">
        {children}
      </main>
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}
""", encoding="utf-8")
print("AppLayout.tsx ✓")

# ─── TimerCard — CircularProgress ring, connected to stores ──────────────────
(zen / "TimerCard.tsx").write_text("""'use client'

import { useCallback } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import { useTimerStore, useDataStore } from '@/stores'

interface CircularProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  animate?: boolean
}

const CircularProgress = ({
  percentage,
  size = 200,
  strokeWidth = 12,
  animate = false,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        className="text-muted/15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-primary"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: animate
            ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)'
            : 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: animate ? 'drop-shadow(0 0 8px hsl(166 28% 62% / 0.4))' : 'none',
        }}
      />
    </svg>
  )
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TimerCard() {
  const {
    isRunning, isStarting, isStopping, elapsedTime,
    selectedProject, description,
    setSelectedProject, updateDescription, startTimer, stopTimer,
  } = useTimerStore()
  const { projects } = useDataStore()

  const targetSeconds = 8 * 3600
  const percentage = Math.min((elapsedTime / targetSeconds) * 100, 100)

  const toggleTimer = useCallback(async () => {
    try {
      if (isRunning) {
        await stopTimer()
      } else {
        await startTimer({
          project_id: selectedProject?.id,
          description: description.trim() || undefined,
        })
      }
    } catch {}
  }, [isRunning, startTimer, stopTimer, selectedProject, description])

  const endSession = useCallback(async () => {
    try { await stopTimer() } catch {}
  }, [stopTimer])

  return (
    <div className="bento-card p-5 lg:p-6 flex flex-col items-center gap-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
      {/* Project chip row */}
      <div className="w-full flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Timer</p>
        {selectedProject && (
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            />
            {selectedProject.name}
            <span className="opacity-50 ml-0.5">×</span>
          </button>
        )}
      </div>

      {/* Ring + time */}
      <div className="relative">
        <CircularProgress percentage={percentage} size={200} strokeWidth={12} animate={isRunning} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-4xl font-light tabular-time text-foreground select-none">
            {formatTime(elapsedTime)}
          </p>
          <button
            onClick={toggleTimer}
            disabled={isStarting || isStopping}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-40 glow-primary-hover"
            style={{
              background: isRunning ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--primary))',
              color: isRunning ? 'hsl(var(--primary))' : 'hsl(var(--primary-foreground))',
            }}
          >
            {isRunning
              ? <Pause size={18} strokeWidth={2} />
              : <Play  size={18} strokeWidth={2} fill="currentColor" />
            }
          </button>
        </div>
      </div>

      {/* Task name input */}
      <input
        type="text"
        value={description}
        onChange={e => updateDescription(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggleTimer() }}
        placeholder="What are you working on?"
        className="w-full bg-transparent text-center text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b pb-1 transition-colors"
        style={{ borderColor: 'hsl(0 0% 100% / 0.06)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'hsl(0 0% 100% / 0.06)')}
      />

      {/* Bottom row */}
      <div className="w-full flex items-center justify-between">
        {/* Project selector */}
        <div className="flex-1 min-w-0">
          {!selectedProject ? (
            <select
              value=""
              onChange={e => {
                const p = projects.find(x => String(x.id) === e.target.value)
                if (p) setSelectedProject(p)
              }}
              className="text-xs text-muted-foreground bg-transparent focus:outline-none cursor-pointer appearance-none truncate max-w-full"
            >
              <option value="" disabled>No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground truncate">{selectedProject.name}</span>
          )}
        </div>

        {/* End session */}
        {isRunning && (
          <button
            onClick={endSession}
            disabled={isStopping}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
          >
            <Square size={12} fill="currentColor" />
            End session
          </button>
        )}
      </div>
    </div>
  )
}
""", encoding="utf-8")
print("TimerCard.tsx ✓")

# ─── DailySummary — single bento-card, GaugeRing, connected to stores ────────
(zen / "DailySummary.tsx").write_text("""'use client'

import { useMemo } from 'react'
import { Flame, Target, Clock } from 'lucide-react'
import { useDataStore } from '@/stores'

const GaugeRing = ({
  value,
  max,
  size = 48,
  strokeWidth = 4,
}: {
  value: number
  max: number
  size?: number
  strokeWidth?: number
}) => {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = c - pct * c

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        className="text-muted/15"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-primary"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  )
}

function fmtHm(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

export default function DailySummary() {
  const { dashboardSummary, recentEntries } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const focusPct = total > 0 ? Math.round((billable / total) * 100) : 0

  const streak = useMemo(() => {
    const seen = new Set(
      recentEntries.map(e => {
        const d = new Date(e.start_time instanceof Date ? e.start_time : String(e.start_time))
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    )
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

  return (
    <div className="bento-card p-5 flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Today</p>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
          <Clock size={18} className="text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-2xl font-light tabular-time text-foreground">{fmtHm(total)}</p>
          <p className="text-[10px] text-muted-foreground/60">Total tracked</p>
        </div>
      </div>

      <div className="h-px" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <GaugeRing value={focusPct} max={100} size={40} strokeWidth={3.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Target size={12} className="text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{focusPct}%</p>
            <p className="text-[10px] text-muted-foreground/60">Billable</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <Flame size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{streak} {streak === 1 ? 'day' : 'days'}</p>
            <p className="text-[10px] text-muted-foreground/60">Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
""", encoding="utf-8")
print("DailySummary.tsx ✓")

# ─── NowPlaying — pure UI music widget ───────────────────────────────────────
(zen / "NowPlaying.tsx").write_text("""'use client'

import { useState } from 'react'
import { SkipBack, Pause, Play, SkipForward } from 'lucide-react'

export default function NowPlaying() {
  const [playing, setPlaying] = useState(true)

  return (
    <div className="bento-card p-5 flex flex-col gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.1))' }}>
          <span className="text-lg">🎵</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground/70">Focus Playlist</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate mt-0.5">Lo-fi Ambient</p>
          <p className="text-[11px] text-muted-foreground truncate">Zen Sounds</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.15)' }}>
        <div className="h-full w-[65%] rounded-full transition-all" style={{ background: 'hsl(var(--primary) / 0.6)' }} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setPlaying(p => !p)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform text-background"
          style={{ background: 'hsl(var(--foreground))' }}
        >
          {playing
            ? <Pause size={14} fill="currentColor" />
            : <Play  size={14} fill="currentColor" />
          }
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  )
}
""", encoding="utf-8")
print("NowPlaying.tsx ✓")

# ─── QuickActions — 2×2 scene cards + DND toggle ─────────────────────────────
(zen / "QuickActions.tsx").write_text("""'use client'

import { useState } from 'react'
import { Monitor, Headphones, Coffee, Moon } from 'lucide-react'

const SCENES = [
  { icon: Monitor,    label: 'Focus Mode',  subtitle: 'Deep work' },
  { icon: Headphones, label: 'Meeting',     subtitle: 'Calls'     },
  { icon: Coffee,     label: 'Break Time',  subtitle: 'Relax'     },
  { icon: Moon,       label: 'Wind Down',   subtitle: 'End of day'},
]

function ToggleSwitch({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  return (
    <button
      onClick={() => setOn(!on)}
      className="w-11 h-6 rounded-full relative transition-all duration-300"
      style={{ background: on ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.3)' }}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300`}
        style={{
          background: 'hsl(var(--primary-foreground))',
          transform: on ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  )
}

export default function QuickActions() {
  const [activeScene, setActiveScene] = useState(0)
  const [dnd, setDnd] = useState(true)

  return (
    <>
      {/* 2×2 scene grid */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 animate-fade-in">
        {SCENES.map((scene, i) => (
          <button
            key={scene.label}
            onClick={() => setActiveScene(i)}
            className={`flex flex-col items-start gap-3 p-4 rounded-3xl transition-all duration-300 text-left ${
              activeScene === i ? 'bento-sage' : 'bento-card hover:bg-card/80'
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className="p-2.5 rounded-2xl transition-colors"
              style={{ background: activeScene === i ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.15)' }}
            >
              <scene.icon
                size={18}
                className={activeScene === i ? 'text-primary' : 'text-muted-foreground'}
                strokeWidth={1.8}
              />
            </div>
            <div>
              <p className={`text-xs font-medium ${activeScene === i ? 'text-foreground' : 'text-muted-foreground'}`}>
                {scene.label}
              </p>
              <p className="text-[10px] text-muted-foreground/60">{scene.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* DND toggle */}
      <div className="bento-sage p-4 flex items-center justify-between animate-fade-in" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.2)' }}>
            <Monitor size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Do Not Disturb</p>
            <p className="text-[10px] text-muted-foreground/60">Notifications paused</p>
          </div>
        </div>
        <ToggleSwitch on={dnd} setOn={setDnd} />
      </div>
    </>
  )
}
""", encoding="utf-8")
print("QuickActions.tsx ✓")

# ─── ProjectsGrid — MiniRing, 3-col, connected to stores ─────────────────────
(zen / "ProjectsGrid.tsx").write_text("""'use client'

import { useState } from 'react'
import { Play, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useDataStore, useTimerStore } from '@/stores'
import type { Project } from '@/types'

function fmtHm(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}

const MiniRing = ({ progress }: { progress: number }) => {
  const size = 32
  const sw = 2.5
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const offset = c - (progress / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        className="text-muted/15"
        stroke="currentColor"
        strokeWidth={sw}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-primary"
        stroke="currentColor"
        strokeWidth={sw}
        fill="transparent"
        r={r}
        cx={size / 2}
        cy={size / 2}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  )
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, selectedProject, setSelectedProject, startTimer } = useTimerStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const maxTime = projects.reduce((m, p) => Math.max(m, p.total_time ?? 0), 1)

  const quickStart = async (p: Project) => {
    setSelectedProject(p)
    setActiveId(String(p.id))
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <div className="bento-card p-5 lg:p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Projects</p>

      {isLoadingProjects ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted) / 0.1)' }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <FolderOpen size={28} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No projects yet</p>
          <Link
            href="/app/projects"
            className="text-xs px-4 py-2 rounded-full font-medium transition-opacity hover:opacity-80"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p, i) => {
            const isActive = activeId === String(p.id) || selectedProject?.id === p.id
            const progress = maxTime > 0 ? Math.round(((p.total_time ?? 0) / maxTime) * 100) : 0
            return (
              <div
                key={p.id}
                className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-200 group ${
                  isActive
                    ? 'ring-1 ring-primary/20'
                    : ''
                }`}
                style={{
                  background: isActive
                    ? 'hsl(var(--primary) / 0.1)'
                    : 'hsl(var(--muted) / 0.06)',
                  animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.12)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.06)'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MiniRing progress={progress} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtHm(p.total_time ?? 0)} today</p>
                  </div>
                </div>
                <button
                  onClick={() => quickStart(p)}
                  className={`p-2 rounded-xl transition-all duration-200 active:scale-90 shrink-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground glow-primary'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                  style={isActive ? {} : { background: 'hsl(var(--muted) / 0.1)' }}
                  aria-label={`Start ${p.name} timer`}
                >
                  <Play size={14} fill={isActive ? 'currentColor' : 'none'} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
""", encoding="utf-8")
print("ProjectsGrid.tsx ✓")

# ─── TimeEntries — space-y-1, connected to stores ────────────────────────────
(zen / "TimeEntries.tsx").write_text("""'use client'

import { Edit2, Trash2 } from 'lucide-react'
import { useDataStore } from '@/stores'

function fmtDuration(sec: number) {
  if (!sec) return '0:00'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `0:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtClock(v: unknown) {
  try {
    return (v instanceof Date ? v : new Date(String(v)))
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch { return '' }
}

function isToday(v: unknown) {
  try {
    const d = (v instanceof Date ? v : new Date(String(v)))
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  } catch { return false }
}

export default function TimeEntries() {
  const { recentEntries, isLoadingEntries, deleteTimeEntry } = useDataStore()

  const entries = recentEntries.filter(e => isToday(e.start_time))

  return (
    <div className="bento-card p-5 lg:p-6 animate-fade-in h-full" style={{ animationDelay: '300ms' }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Today&apos;s Entries
      </p>

      {isLoadingEntries ? (
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: 'hsl(var(--muted) / 0.08)' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-muted-foreground/50 text-xs py-8">No entries yet</p>
      ) : (
        <div className="space-y-1">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-2xl transition-colors duration-200 group"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted) / 0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs text-foreground truncate">
                  {entry.description || 'Untitled entry'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }}
                  />
                  <p className="text-[10px] text-muted-foreground truncate">
                    {(entry as any).project?.name || '—'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 tabular-time hidden sm:block">
                {fmtClock(entry.start_time)}
              </p>
              <p className="text-xs font-medium tabular-time text-foreground">
                {fmtDuration(entry.duration)}
              </p>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Edit entry"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => deleteTimeEntry(String(entry.id))}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Delete entry"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
""", encoding="utf-8")
print("TimeEntries.tsx ✓")

# ─── Dashboard page — 12-col bento grid ──────────────────────────────────────
(root / "src/app/app/dashboard/page.tsx").write_text("""'use client'

import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'
import TimerCard    from '@/components/zen/TimerCard'
import DailySummary from '@/components/zen/DailySummary'
import NowPlaying   from '@/components/zen/NowPlaying'
import QuickActions from '@/components/zen/QuickActions'
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
    <div className="p-3 lg:p-4 overflow-y-auto">
      <div className="grid grid-cols-12 gap-3 lg:gap-4 auto-rows-min max-w-[1600px] mx-auto">

        {/* Row 1 — QuickActions | Timer | Daily+NowPlaying */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 lg:gap-4">
          <QuickActions />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <TimerCard />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3 lg:gap-4">
          <DailySummary />
          <NowPlaying />
        </div>

        {/* Row 2 — Projects | TimeEntries */}
        <div className="col-span-12 lg:col-span-7">
          <ProjectsGrid />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <TimeEntries />
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => { if (!isRunning) startTimer().catch(() => {}) }}
        className="fixed bottom-6 right-6 h-12 px-5 flex items-center justify-center gap-2 rounded-full font-medium glow-primary glow-primary-hover transition-all duration-300 hover:-translate-y-1 active:scale-95 z-50 text-sm"
        style={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        }}
      >
        <Plus size={18} />
        New Timer
      </button>
    </div>
  )
}
""", encoding="utf-8")
print("dashboard/page.tsx ✓")

print("\nAll done!")
