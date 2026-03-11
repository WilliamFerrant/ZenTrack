'use client'

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
