// Main application layout
'use client'

import { ReactNode, useEffect } from 'react'
import { Header } from './Header'
import { ToastContainer } from '../ui/ToastContainer'
import { ModalContainer } from '../ui/ModalContainer'
import { NetworkStatusIndicator } from '../ui/NetworkStatusIndicator'
import { useAppInitialization } from '@/stores'

export interface AppLayoutProps {
  children: ReactNode
  title?: string
  showSidebar?: boolean
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, initializeApp } = useAppInitialization()

  useEffect(() => {
    if (isAuthenticated) {
      initializeApp().catch(console.error)
    }
  }, [isAuthenticated, initializeApp])

  return (
    <div className="min-h-screen bg-[#1f1f1f]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}
