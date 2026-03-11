// Main time tracking page
'use client'

import { TimerDisplay } from '@/components/timer/TimerDisplay'
import { TimerControls } from '@/components/timer/TimerControls'
import { RecentEntries } from '@/components/timer/RecentEntries'

export default function TrackingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#e5e7eb]">Time Tracking</h1>
        <p className="mt-0.5 text-sm text-[#6b7280]">Track your time with precision</p>
      </div>

      <div className="bg-[#252525] border border-[#2e2e2e] rounded-3xl p-6">
        <div className="text-center space-y-6">
          <TimerDisplay />
          <TimerControls />
        </div>
      </div>

      <div className="bg-[#252525] border border-[#2e2e2e] rounded-3xl p-6">
        <h2 className="text-sm font-semibold text-[#e5e7eb] mb-4">Recent Entries</h2>
        <RecentEntries />
      </div>
    </div>
  )
}