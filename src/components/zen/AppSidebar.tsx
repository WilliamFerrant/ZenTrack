'use client'

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
