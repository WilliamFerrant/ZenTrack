'use client'

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
