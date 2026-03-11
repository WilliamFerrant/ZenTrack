// Network connectivity status indicator
'use client'

import { useNetworkStatus } from '@/hooks/useNetworkStatus'

interface NetworkStatusIndicatorProps {
  className?: string
}

export function NetworkStatusIndicator({ className = '' }: NetworkStatusIndicatorProps) {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) {
    return null // Don't show anything when online normally
  }

  if (!isOnline) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Offline</span>
        </div>
      </div>
    )
  }

  if (wasOffline) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm font-medium">Back online</span>
        </div>
      </div>
    )
  }

  return null
}