// Recent time entries component showing daily time tracking
'use client'

import { useEffect } from 'react'
import { useDataStore, formatDuration } from '@/stores'
import type { TimeEntry } from '@/types'

interface RecentEntriesProps {
  className?: string
}

export function RecentEntries({ className = '' }: RecentEntriesProps) {
  const {
    recentEntries,
    isLoadingEntries,
    fetchRecentEntries,
    error
  } = useDataStore()

  // Load recent entries when component mounts
  useEffect(() => {
    fetchRecentEntries(10) // Load last 10 entries
  }, [fetchRecentEntries])

  // Group entries by date
  const groupedEntries = recentEntries.reduce((groups: Record<string, TimeEntry[]>, entry) => {
    const date = new Date(entry.start_time).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {})

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const calculateDayTotal = (entries: TimeEntry[]) => {
    const totalSeconds = entries.reduce((total, entry) => total + entry.duration, 0)
    return formatDuration(totalSeconds)
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">⚠️ Failed to load recent entries</div>
        <button
          onClick={() => fetchRecentEntries(10)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (isLoadingEntries) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-500 text-sm">Loading recent entries...</div>
      </div>
    )
  }

  if (recentEntries.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg mb-2">No time entries yet</p>
        <p className="text-gray-400 text-sm">
          Start your first timer above to begin tracking your time
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([dateString, entries]) => {
          const dayTotal = calculateDayTotal(entries)

          return (
            <div key={dateString} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">
                  {formatDate(dateString)}
                </h3>
                <span className="text-sm font-medium text-blue-600">
                  {dayTotal}
                </span>
              </div>

              {/* Day Entries */}
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Project Info */}
                      <div className="flex items-center space-x-2 mb-1">
                        {entry.project && (
                          <>
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: entry.project.color }}
                            />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {entry.project.name}
                            </span>
                          </>
                        )}
                        {!entry.project && (
                          <span className="text-sm text-gray-500">No project</span>
                        )}
                      </div>

                      {/* Description */}
                      {entry.description && (
                        <p className="text-sm text-gray-600 truncate">
                          {entry.description}
                        </p>
                      )}

                      {/* Time Range */}
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>{formatTime(entry.start_time)}</span>
                        <span>−</span>
                        <span>{formatTime(entry.end_time)}</span>
                        {entry.is_billable && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Billable
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex-shrink-0 ml-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDuration(entry.duration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}