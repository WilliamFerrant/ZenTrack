'use client'

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
