// Browser notification reminder when no timer has been running for X hours
import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/stores'

const REMINDER_AFTER_MS = 2 * 60 * 60 * 1000  // 2 hours idle
const CHECK_INTERVAL_MS = 5 * 60 * 1000         // check every 5 minutes

export function useTimerReminder() {
  const isRunning = useTimerStore(s => s.isRunning)
  const lastStopRef = useRef<number>(Date.now())
  const notifiedRef = useRef(false)

  // Track when timer stops
  useEffect(() => {
    if (!isRunning) {
      lastStopRef.current = Date.now()
      notifiedRef.current = false
    }
  }, [isRunning])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Request permission once
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    const interval = setInterval(() => {
      if (isRunning) return                                          // timer running — no reminder
      if (notifiedRef.current) return                               // already notified this idle stretch
      if (Notification.permission !== 'granted') return

      const idleMs = Date.now() - lastStopRef.current
      if (idleMs >= REMINDER_AFTER_MS) {
        notifiedRef.current = true
        const n = new Notification('ZenTracker — No active timer', {
          body: "You haven't tracked time in over 2 hours. Don't forget to start your timer!",
          icon: '/favicon.ico',
          tag: 'zentracker-reminder',
        })
        n.onclick = () => { window.focus(); n.close() }
      }
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isRunning])
}
