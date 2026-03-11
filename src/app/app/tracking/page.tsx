'use client'

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
