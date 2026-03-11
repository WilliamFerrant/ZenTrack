import pathlib

root = pathlib.Path(r"c:\web dev\time-tracker")
zen  = root / "src/components/zen"
zen.mkdir(parents=True, exist_ok=True)

# ─── globals.css — exact CSS variables from reference ────────────────────────
(root / "src/app/globals.css").write_text('''@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 12%;
    --foreground: 225 8% 90%;

    --card: 0 0% 15%;
    --card-foreground: 225 8% 90%;

    --popover: 0 0% 15%;
    --popover-foreground: 225 8% 90%;

    --primary: 122 10% 72%;
    --primary-foreground: 0 0% 12%;

    --secondary: 0 0% 18%;
    --secondary-foreground: 225 8% 90%;

    --muted: 225 8% 40%;
    --muted-foreground: 225 8% 70%;

    --accent: 122 10% 72%;
    --accent-foreground: 0 0% 12%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 100%;
    --input: 0 0% 20%;
    --ring: 122 10% 72%;

    --radius: 0.75rem;

    --sidebar-background: 0 0% 10%;
    --sidebar-foreground: 225 8% 70%;
    --sidebar-primary: 122 10% 72%;
    --sidebar-primary-foreground: 0 0% 12%;
    --sidebar-accent: 0 0% 15%;
    --sidebar-accent-foreground: 225 8% 90%;
    --sidebar-border: 0 0% 100%;
    --sidebar-ring: 122 10% 72%;
  }
}

@layer base {
  * {
    @apply border-border/5;
    box-sizing: border-box;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  * {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted) / 0.4) transparent;
  }
}

@layer utilities {
  .glass-card {
    @apply rounded-2xl backdrop-blur-xl;
    background: hsl(var(--card) / 0.7);
    box-shadow:
      0 0 0 1px hsl(var(--border) / 0.05),
      0px 4px 8px -2px rgba(0,0,0,0.1),
      0px 10px 20px -5px rgba(0,0,0,0.2);
    transition: box-shadow 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .glass-card:hover {
    box-shadow:
      0 0 0 1px hsl(var(--border) / 0.08),
      0px 8px 16px -4px rgba(0,0,0,0.15),
      0px 20px 30px -10px rgba(0,0,0,0.25);
  }
  .tabular-nums {
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
  }
}
''', encoding="utf-8")
print("globals.css ✓")

# ─── tailwind.config.js ───────────────────────────────────────────────────────
(root / "tailwind.config.js").write_text('''/** @type {import(\'tailwindcss\').Config} */
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
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in-up":     "fade-in-up 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
''', encoding="utf-8")
print("tailwind.config.js ✓")

# ─── AppSidebar (ZenSidebar style — wide, in-flow) ────────────────────────────
(zen / "AppSidebar.tsx").write_text("""'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart2, FolderOpen, Clock, FileText, History, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores'

const NAV = [
  { icon: BarChart2,  label: 'Dashboard', href: '/app/dashboard' },
  { icon: FolderOpen, label: 'Projects',  href: '/app/projects'  },
  { icon: Clock,      label: 'Timer',     href: '/app/tracking'  },
  { icon: FileText,   label: 'Reports',   href: '/app/reports'   },
  { icon: History,    label: 'History',   href: '/app/reports'   },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    try { await logout(); router.push('/login') } catch {}
  }

  return (
    <aside className="w-64 p-6 flex-shrink-0 hidden lg:flex flex-col"
      style={{ background: 'hsl(var(--sidebar-background))', borderRight: '1px solid hsl(var(--border) / 0.05)' }}>
      {/* Brand */}
      <Link href="/app/dashboard"
        className="text-2xl font-bold text-foreground mb-12 tracking-tight block hover:opacity-80 transition-opacity">
        ZenTrack
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={label} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.6} />
              <span className="font-medium text-sm">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Settings */}
      <Link href="/app/settings"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors mb-2">
        <Settings size={20} strokeWidth={1.6} />
        <span className="font-medium text-sm">Settings</span>
      </Link>

      {/* User */}
      <div className="flex items-center gap-3 px-1 pt-3"
        style={{ borderTop: '1px solid hsl(var(--border) / 0.06)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
          style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
          {user?.first_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button onClick={handleLogout} title="Sign out"
          className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <LogOut size={15} strokeWidth={1.6} />
        </button>
      </div>
    </aside>
  )
}
""", encoding="utf-8")
print("AppSidebar.tsx ✓")

# ─── ZenTopBar ────────────────────────────────────────────────────────────────
(zen / "ZenTopBar.tsx").write_text("""'use client'

import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useAuthStore } from '@/stores'

const PAGE_TITLES: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/tracking':  'Live Timer',
  '/app/projects':  'Projects',
  '/app/reports':   'Reports',
  '/app/settings':  'Settings',
}

export default function ZenTopBar() {
  const pathname = usePathname()
  const { user }  = useAuthStore()

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'Dashboard'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })

  return (
    <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 lg:px-8"
      style={{ borderBottom: '1px solid hsl(var(--border) / 0.05)' }}>
      <div>
        <h1 className="text-xl font-medium text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search..."
            className="rounded-lg h-10 pl-10 pr-4 w-56 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-shadow"
            style={{ background: 'hsl(var(--secondary) / 0.5)' }}
            onFocus={e => (e.currentTarget.style.boxShadow = '0 0 0 2px hsl(var(--ring) / 0.5)')}
            onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
          />
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
            style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
            {user?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-sm text-foreground">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase() || 'Member'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
""", encoding="utf-8")
print("ZenTopBar.tsx ✓")

# ─── TimerCard — full framer-motion ring ─────────────────────────────────────
(zen / "TimerCard.tsx").write_text("""'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause } from 'lucide-react'
import { useTimerStore, useDataStore } from '@/stores'

function pad(n: number) { return String(n).padStart(2, '0') }
function splitTime(sec: number) {
  return {
    h: pad(Math.floor(sec / 3600)),
    m: pad(Math.floor((sec % 3600) / 60)),
    s: pad(sec % 60),
  }
}

const circumference = 2 * Math.PI * 45   // r = 45, viewBox 0 0 100 100

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

  const progress  = Math.min((elapsedTime / (8 * 3600)) * 100, 100)
  const { h, m, s } = splitTime(elapsedTime)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="glass-card p-6 lg:p-8 flex flex-col items-center justify-center gap-0"
    >
      {/* Progress ring */}
      <div className="relative w-56 h-56 lg:w-72 lg:h-72">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r="45" fill="none"
            stroke="hsl(var(--muted) / 0.15)" strokeWidth="4" />
          {/* Progress */}
          <motion.circle cx="50" cy="50" r="45" fill="none"
            stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))' }}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${(progress / 100) * circumference} ${circumference}` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        {/* Center button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={toggle}
            disabled={isStarting || isStopping}
            className="bg-card/80 rounded-full w-20 h-20 lg:w-28 lg:h-28 flex items-center justify-center shadow-lg transition-colors hover:bg-card disabled:opacity-50"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isRunning ? 'pause' : 'play'}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
              >
                {isRunning
                  ? <Pause size={40} className="text-primary" />
                  : <Play  size={40} className="text-primary" fill="currentColor" />
                }
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Task name — underline input */}
      <input
        type="text"
        value={description}
        onChange={e => updateDescription(e.target.value)}
        placeholder="What are you working on?"
        onKeyDown={e => { if (e.key === 'Enter' && !isRunning && !isStarting) toggle() }}
        className="bg-transparent text-center text-lg lg:text-xl font-medium mt-6 w-full max-w-sm focus:outline-none border-b border-transparent text-foreground placeholder:text-muted-foreground transition-colors pb-1"
        style={{ borderBottomColor: 'hsl(var(--border) / 0.1)' }}
        onFocus={e => (e.currentTarget.style.borderBottomColor = 'hsl(var(--primary) / 0.3)')}
        onBlur={e => (e.currentTarget.style.borderBottomColor = 'hsl(var(--border) / 0.1)')}
      />

      {/* Clock */}
      <div className="text-5xl lg:text-6xl font-light tabular-nums mt-3 text-foreground tracking-tight select-none">
        <span>{h}</span>
        <span className="text-muted-foreground">:</span>
        <span>{m}</span>
        <span className="text-muted-foreground">:</span>
        <span>{s}</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4 mt-5">
        {selectedProject ? (
          <button onClick={() => setSelectedProject(null)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors hover:opacity-80"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedProject.color }} />
              {selectedProject.name}
              <span className="opacity-50">×</span>
            </span>
          </button>
        ) : (
          <select
            value=""
            onChange={e => setSelectedProject(projects.find(p => String(p.id) === e.target.value) ?? null)}
            className="text-xs bg-transparent text-muted-foreground focus:outline-none cursor-pointer appearance-none"
            style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.375rem 0.75rem', borderRadius: 9999 }}
          >
            <option value="" disabled>Select project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {isRunning && (
          <button onClick={toggle} disabled={isStopping}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
            End Session
          </button>
        )}
      </div>
    </motion.div>
  )
}
""", encoding="utf-8")
print("TimerCard.tsx ✓")

# ─── DailySummary — 3 stacked SummaryCards ───────────────────────────────────
(zen / "DailySummary.tsx").write_text("""'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useDataStore } from '@/stores'

// SVG circle-as-path gauge (matches reference exactly)
const CIRC = 2 * Math.PI * 15.9155   // ≈ 100

function SummaryCard({
  title, value, gaugeValue, delay = 0,
}: {
  title: string; value: string; gaugeValue?: number; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + delay, ease: [0.32, 0.72, 0, 1] }}
      className="glass-card p-5"
    >
      <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{title}</h3>
      <div className="flex items-end justify-between mt-2">
        <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
        {gaugeValue !== undefined && (
          <div className="w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--muted) / 0.15)" strokeWidth="3"
              />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.3))' }}
                initial={{ strokeDasharray: `0, ${CIRC}` }}
                animate={{ strokeDasharray: `${(gaugeValue / 100) * CIRC}, ${CIRC}` }}
                transition={{ duration: 1, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function fmtHM(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}`
}

export default function DailySummary() {
  const { dashboardSummary, recentEntries } = useDataStore()

  const total    = dashboardSummary?.totals?.total_time    ?? 0
  const billable = dashboardSummary?.totals?.billable_time ?? 0
  const billPct  = total > 0 ? Math.round((billable / total) * 100) : 0

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

  return (
    <div className="space-y-4">
      <SummaryCard title="Total Today"     value={fmtHM(total)}     delay={0}    />
      <SummaryCard title="Billable"        value={`${billPct}%`}    gaugeValue={billPct} delay={0.05} />
      <SummaryCard title="Current Streak"  value={`${streak} Day${streak !== 1 ? 's' : ''}`} delay={0.1} />
    </div>
  )
}
""", encoding="utf-8")
print("DailySummary.tsx ✓")

# ─── ProjectsGrid — 6-col Quick Start ────────────────────────────────────────
(zen / "ProjectsGrid.tsx").write_text("""'use client'

import { motion } from 'framer-motion'
import { Play, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useDataStore, useTimerStore } from '@/stores'
import type { Project } from '@/types'

function fmtHM(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0')
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}`
}

export default function ProjectsGrid() {
  const { projects, isLoadingProjects } = useDataStore()
  const { isRunning, setSelectedProject, startTimer } = useTimerStore()

  const quickStart = async (p: Project) => {
    setSelectedProject(p)
    if (!isRunning) {
      try { await startTimer({ project_id: p.id }) } catch {}
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
    >
      <h2 className="text-lg font-medium text-foreground mb-4">Quick Start</h2>

      {isLoadingProjects ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-32 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-8 flex flex-col items-center gap-3">
          <FolderOpen size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No projects yet</p>
          <Link href="/app/projects"
            className="text-xs px-4 py-2 rounded-lg font-medium transition-colors hover:opacity-80"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            Create project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {projects.slice(0, 6).map((p, i) => (
            <motion.button
              key={p.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => quickStart(p)}
              className="glass-card p-4 flex flex-col items-start text-left h-32 justify-between group relative overflow-hidden"
            >
              <div>
                <div className="w-2.5 h-2.5 rounded-full mb-2"
                  style={{ backgroundColor: p.color || 'hsl(var(--primary))' }} />
                <p className="font-medium text-sm text-foreground">{p.name}</p>
              </div>
              <div className="flex items-end justify-between w-full">
                <div>
                  <p className="text-[11px] text-muted-foreground">Today</p>
                  <p className="font-mono text-sm text-foreground tabular-nums">
                    {fmtHM(p.total_time ?? 0)}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} className="text-primary" fill="currentColor" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
""", encoding="utf-8")
print("ProjectsGrid.tsx ✓")

# ─── TimeEntries — divide-y table with edit/delete ───────────────────────────
(zen / "TimeEntries.tsx").write_text("""'use client'

import { motion } from 'framer-motion'
import { Edit2, Trash2, Clock } from 'lucide-react'
import { useDataStore } from '@/stores'

function fmtHM(sec: number) {
  if (!sec) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`
}
function fmtClock(v: unknown) {
  try {
    return (v instanceof Date ? v : new Date(String(v)))
      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return '' }
}

export default function TimeEntries() {
  const { recentEntries, isLoadingEntries, deleteTimeEntry } = useDataStore()

  // show today's entries by default
  const today = new Date()
  const entries = recentEntries.filter(e => {
    const d = new Date(e.start_time instanceof Date ? e.start_time : String(e.start_time))
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="glass-card overflow-hidden"
    >
      <div className="p-6">
        <h2 className="text-lg font-medium text-foreground">Today's Entries</h2>
      </div>

      {isLoadingEntries ? (
        <div className="px-6 pb-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse"
              style={{ background: 'hsl(var(--secondary) / 0.5)' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3"
          style={{ borderTop: '1px solid hsl(var(--border) / 0.05)' }}>
          <Clock size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No entries today</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'hsl(var(--border) / 0.05)' }}>
          {entries.map(entry => (
            <div key={entry.id}
              className="flex items-center justify-between px-6 py-4 group transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'hsl(var(--secondary) / 0.3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
            >
              {/* Description + project */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground truncate">
                    {entry.description || 'Untitled entry'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: (entry as any).project?.color || 'hsl(var(--primary))' }} />
                  <span className="text-xs text-muted-foreground truncate">
                    {(entry as any).project?.name || '—'}
                  </span>
                </div>
              </div>

              {/* Time + actions */}
              <div className="flex items-center gap-5 flex-shrink-0">
                <span className="font-mono text-xs text-muted-foreground">
                  {fmtClock(entry.start_time)}
                </span>
                <span className="font-medium text-sm tabular-nums text-foreground w-14 text-right">
                  {fmtHM(entry.duration)}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteTimeEntry(String(entry.id))}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
""", encoding="utf-8")
print("TimeEntries.tsx ✓")

# ─── AppLayout — flex row: sidebar | main(topbar + content) ──────────────────
(root / "src/components/layout/AppLayout.tsx").write_text("""'use client'

import { ReactNode, useEffect } from 'react'
import AppSidebar from '../zen/AppSidebar'
import ZenTopBar  from '../zen/ZenTopBar'
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
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ZenTopBar />
        <div className="flex-1 p-4 lg:p-6 xl:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}
""", encoding="utf-8")
print("AppLayout.tsx ✓")

# ─── Dashboard page — grid-cols-3 layout ─────────────────────────────────────
(root / "src/app/app/dashboard/page.tsx").write_text("""'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useDataStore, useTimerStore } from '@/stores'
import TimerCard    from '@/components/zen/TimerCard'
import DailySummary from '@/components/zen/DailySummary'
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Timer — 2 cols */}
        <div className="lg:col-span-2">
          <TimerCard />
        </div>

        {/* Daily summary — 1 col */}
        <div className="lg:col-span-1">
          <DailySummary />
        </div>

        {/* Projects — full width */}
        <div className="lg:col-span-3">
          <ProjectsGrid />
        </div>

        {/* Time entries — full width */}
        <div className="lg:col-span-3">
          <TimeEntries />
        </div>
      </div>

      {/* FAB — mobile only */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { if (!isRunning) startTimer().catch(() => {}) }}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 flex items-center justify-center shadow-lg lg:hidden"
        style={{
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          boxShadow: '0 4px 20px hsl(var(--primary) / 0.3)',
        }}
      >
        <Plus size={24} />
      </motion.button>
    </>
  )
}
""", encoding="utf-8")
print("dashboard/page.tsx ✓")

# ─── Tracking page — dark themed ─────────────────────────────────────────────
(root / "src/app/app/tracking/page.tsx").write_text("""'use client'

import { TimerDisplay }  from '@/components/timer/TimerDisplay'
import { TimerControls } from '@/components/timer/TimerControls'
import { RecentEntries } from '@/components/timer/RecentEntries'

export default function TrackingPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="glass-card p-6">
        <div className="text-center space-y-6">
          <TimerDisplay />
          <TimerControls />
        </div>
      </div>
      <div className="glass-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Recent Entries</h2>
        <RecentEntries />
      </div>
    </div>
  )
}
""", encoding="utf-8")
print("tracking/page.tsx ✓")

# ─── Update modal + toast to use glass-card ──────────────────────────────────
modal_path = root / "src/components/ui/ModalContainer.tsx"
modal  = modal_path.read_text(encoding="utf-8")
modal  = modal.replace('bento-card px-4 pt-5', 'glass-card px-4 pt-5')
modal  = modal.replace('"fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"', '"fixed inset-0 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}')
modal_path.write_text(modal, encoding="utf-8")

toast_path = root / "src/components/ui/ToastContainer.tsx"
toast = toast_path.read_text(encoding="utf-8")
toast = toast.replace("'max-w-sm w-full bento-card shadow-2xl pointer-events-auto'", "'max-w-sm w-full glass-card shadow-2xl pointer-events-auto'")
toast_path.write_text(toast, encoding="utf-8")

print("modal + toast ✓")
print("\nAll done!")
