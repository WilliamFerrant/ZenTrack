'use client'

import { useState } from 'react'
import { Monitor, Users, Coffee, Moon, Bell, BellOff } from 'lucide-react'
import { useTimerStore, useDataStore } from '@/stores'

const MODES = [
  { icon: Monitor, label: 'Focus Mode',  desc: 'Deep work',  tag: 'Deep focus session' },
  { icon: Users,   label: 'Meeting',     desc: 'Calls',      tag: 'Team meeting'        },
  { icon: Coffee,  label: 'Break Time',  desc: 'Relax',      tag: 'Short break'         },
  { icon: Moon,    label: 'Wind Down',   desc: 'End of day', tag: 'Daily review'        },
]

export default function QuickActions() {
  const [dnd, setDnd] = useState(false)
  const { isRunning, isStarting, selectedProject, updateDescription, startTimer } = useTimerStore()
  const { dashboardSummary } = useDataStore()

  const handleMode = async (tag: string) => {
    if (isRunning || isStarting) return
    updateDescription(tag)
    try { await startTimer({ description: tag, project_id: selectedProject?.id }) } catch {}
  }

  return (
    <div className="bento-card h-full flex flex-col p-5 gap-3">
      {/* 2×2 action cards */}
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {MODES.map(({ icon: Icon, label, desc, tag }) => (
          <button key={label} onClick={() => handleMode(tag)}
            className="bento-card-hover flex flex-col items-start gap-3 p-4 text-left"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--foreground))' }}
            >
              <Icon size={16} strokeWidth={1.7} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Do Not Disturb toggle card */}
      <div className="bento-card flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'hsl(var(--muted) / 0.5)', color: 'hsl(var(--muted-foreground))' }}
          >
            {dnd ? <BellOff size={14} strokeWidth={1.7} /> : <Bell size={14} strokeWidth={1.7} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Do Not Disturb</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Notifications {dnd ? 'paused' : 'active'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button onClick={() => setDnd(!dnd)}
          className="relative flex-shrink-0 rounded-full transition-colors duration-200"
          style={{
            width: 44, height: 24,
            background: dnd ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.6)',
          }}
        >
          <span className="absolute top-[3px] w-[18px] h-[18px] rounded-full shadow-sm transition-all duration-200"
            style={{
              left: dnd ? '23px' : '3px',
              background: dnd ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground) / 0.7)',
            }}
          />
        </button>
      </div>
    </div>
  )
}
