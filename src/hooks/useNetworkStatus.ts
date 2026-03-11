// Hook for network connectivity status
'use client'

import { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  wasOffline: boolean
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Keep track that we were offline to show reconnection status
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    // Add event listeners for online/offline status
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Reset wasOffline flag after a delay when back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      const timeout = setTimeout(() => {
        setWasOffline(false)
      }, 3000) // Show "reconnected" status for 3 seconds

      return () => clearTimeout(timeout)
    }
  }, [isOnline, wasOffline])

  return { isOnline, wasOffline }
}