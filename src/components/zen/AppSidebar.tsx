// Icon sidebar — 72px wide, fixed left
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
