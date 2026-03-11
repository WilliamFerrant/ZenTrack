// Main time tracking page
'use client'

import { TimerDisplay } from '@/components/timer/TimerDisplay'
import { TimerControls } from '@/components/timer/TimerControls'
import { RecentEntries } from '@/components/timer/RecentEntries'

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Time Tracking</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track your time efficiently with our intuitive timer
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center space-y-6">
          <TimerDisplay />
          <TimerControls />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Entries</h2>
        <RecentEntries />
      </div>
    </div>
  )
}