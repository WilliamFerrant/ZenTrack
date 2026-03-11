'use client'

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
