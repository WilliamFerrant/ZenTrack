'use client'

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
