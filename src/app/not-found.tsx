'use client'

import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, Clock } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 10%, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative text-center max-w-sm w-full space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.12)', boxShadow: '0 0 40px hsl(var(--primary) / 0.1)' }}
          >
            <Clock className="w-9 h-9 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Number */}
        <div className="space-y-2">
          <p
            className="text-8xl font-extralight tracking-tight"
            style={{ color: 'hsl(var(--primary))' }}
          >
            404
          </p>
          <h1 className="text-xl font-medium text-foreground">Page not found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This page doesn&apos;t exist or hasn&apos;t been tracked yet.
          </p>
        </div>

        {/* Decorative dots */}
        <div className="flex justify-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 2 ? 8 : 5,
                height: i === 2 ? 8 : 5,
                background: i === 2 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.25)',
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-muted-foreground border border-border/40 hover:border-primary/40 hover:text-primary transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
          <button
            onClick={() => router.push('/app/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
            style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 20px hsl(var(--primary) / 0.25)' }}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        {/* Branding */}
        <p className="text-xs text-muted-foreground/40">ZenTrack</p>
      </div>
    </div>
  )
}
