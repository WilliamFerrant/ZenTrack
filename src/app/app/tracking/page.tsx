// Main time tracking page
'use client'

import { TimerDisplay } from '@/components/timer/TimerDisplay'
import { TimerControls } from '@/components/timer/TimerControls'
import { RecentEntries } from '@/components/timer/RecentEntries'

export default function TrackingPage() {
  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Time Tracking</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Track your time with precision</p>
      </div>

      <div className="bento-card p-6">
        <div className="text-center space-y-6">
          <TimerDisplay />
          <TimerControls />
        </div>
      </div>

      <div className="bento-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Entries</h2>
        <RecentEntries />
      </div>
    </div>
  )
}