// Main timer display component showing elapsed time and status
'use client'

import { useTimerStore, useFormattedElapsedTime } from '@/stores'

interface TimerDisplayProps {
  size?: 'sm' | 'md' | 'lg'
  showProject?: boolean
  className?: string
}

export function TimerDisplay({ size = 'lg', showProject = true, className = '' }: TimerDisplayProps) {
  const { currentTimer, isRunning } = useTimerStore()
  const formattedTime = useFormattedElapsedTime()

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl md:text-6xl',
  }

  const containerClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  return (
    <div className={`text-center ${containerClasses[size]} ${className}`}>
      {/* Timer Display */}
      <div className={`font-mono font-bold ${sizeClasses[size]} tracking-wider`}>
        {isRunning ? (
          <span className="text-green-600">{formattedTime}</span>
        ) : (
          <span className="text-gray-400">00:00:00</span>
        )}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center mt-4 space-x-2">
        <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
        <span className={`text-sm font-medium ${isRunning ? 'text-green-600' : 'text-gray-500'}`}>
          {isRunning ? 'Timer Running' : 'Timer Stopped'}
        </span>
      </div>

      {/* Current Project Info */}
      {showProject && isRunning && currentTimer && (
        <div className="mt-4 space-y-2">
          {currentTimer.project && (
            <div className="flex items-center justify-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentTimer.project.color }}
              />
              <span className="text-sm font-medium text-gray-700">
                {currentTimer.project.name}
              </span>
            </div>
          )}

          {currentTimer.task && (
            <div className="text-sm text-gray-600">
              Task: {currentTimer.task.name}
            </div>
          )}

          {currentTimer.description && (
            <div className="text-sm text-gray-600 italic">
              "{currentTimer.description}"
            </div>
          )}
        </div>
      )}

      {/* Idle State Message */}
      {!isRunning && size === 'lg' && (
        <div className="mt-6">
          <p className="text-gray-500 text-lg mb-2">
            Ready to track your time
          </p>
          <p className="text-gray-400 text-sm">
            Select a project and click start to begin
          </p>
        </div>
      )}
    </div>
  )
}