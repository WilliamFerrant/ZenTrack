// Timer control buttons for start/stop/pause actions
'use client'

import { useState } from 'react'
import { useTimerStore, useDataStore } from '@/stores'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export interface TimerControlsProps {
  size?: 'sm' | 'md' | 'lg'
  showConfirmation?: boolean
  className?: string
}

export function TimerControls({ size = 'md', showConfirmation = true, className = '' }: TimerControlsProps) {
  const {
    isRunning,
    isStarting,
    isStopping,
    startTimer,
    stopTimer,
    selectedProject,
    description,
    error
  } = useTimerStore()

  const { showModal, hideModal } = useDataStore()
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const { isOnline } = useNetworkStatus()

  const handleStart = async () => {
    if (!isOnline) {
      // Don't attempt to start timer when offline
      return
    }

    try {
      await startTimer({
        project_id: selectedProject?.id,
        description: description.trim() || undefined,
      })
    } catch (error) {
      console.error('Failed to start timer:', error)
      // The error is already handled by the timer store
    }
  }

  const handleStop = async () => {
    if (showConfirmation) {
      setShowStopConfirm(true)
      return
    }

    await executeStop()
  }

  const executeStop = async () => {
    if (!isOnline) {
      // Don't attempt to stop timer when offline, but allow user to retry
      return
    }

    try {
      await stopTimer()
      setShowStopConfirm(false)
    } catch (error) {
      console.error('Failed to stop timer:', error)
      // The error is already handled by the timer store
    }
  }

  const handleStopConfirm = () => {
    showModal({
      title: 'Stop Timer',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to stop the current timer? This will save your time entry.
          </p>
          {description && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Description:</strong> {description}
              </p>
            </div>
          )}
        </div>
      ),
      confirmText: 'Stop Timer',
      cancelText: 'Keep Running',
      onClose: () => hideModal('stop-timer-confirm'),
      onConfirm: () => {
        hideModal('stop-timer-confirm')
        executeStop()
      },
    })
  }

  const buttonSizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const isLoading = isStarting || isStopping

  if (isRunning) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Stop Button */}
        <button
          onClick={showConfirmation ? handleStopConfirm : handleStop}
          disabled={isStopping || !isOnline}
          className={`
            w-full flex items-center justify-center space-x-2 font-semibold rounded-lg transition-colors
            ${buttonSizeClasses[size]}
            ${isStopping || !isOnline
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
            }
          `}
        >
          {isStopping ? (
            <>
              <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizeClasses[size]}`} />
              <span>Stopping...</span>
            </>
          ) : (
            <>
              <StopIcon className={iconSizeClasses[size]} />
              <span>Stop Timer</span>
            </>
          )}
        </button>

        {/* Pause Button (Future enhancement) */}
        {/* <button
          disabled
          className={`
            w-full flex items-center justify-center space-x-2 font-semibold rounded-lg
            ${buttonSizeClasses[size]}
            bg-gray-200 text-gray-400 cursor-not-allowed
          `}
        >
          <PauseIcon className={iconSizeClasses[size]} />
          <span>Pause (Coming Soon)</span>
        </button> */}

        {!isOnline && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              🔌 You&apos;re offline. Timer will continue running locally but can&apos;t be saved until you reconnect.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={isStarting || !isOnline}
        className={`
          w-full flex items-center justify-center space-x-2 font-semibold rounded-lg transition-colors
          ${buttonSizeClasses[size]}
          ${isStarting || !isOnline
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
          }
        `}
      >
        {isStarting ? (
          <>
            <div className={`animate-spin rounded-full border-b-2 border-current ${iconSizeClasses[size]}`} />
            <span>Starting...</span>
          </>
        ) : (
          <>
            <PlayIcon className={iconSizeClasses[size]} />
            <span>Start Timer</span>
          </>
        )}
      </button>

      {/* Project Requirement Notice */}
      {!selectedProject && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            💡 Select a project to better organize your time entries
          </p>
        </div>
      )}

      {!isOnline && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            🔌 You&apos;re offline. Timer functions will be available when you reconnect.
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}

// Icon components
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}