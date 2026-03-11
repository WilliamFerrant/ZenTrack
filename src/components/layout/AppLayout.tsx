'use client'

import { ReactNode, useEffect } from 'react'
import AppSidebar from '../zen/AppSidebar'
import { ToastContainer } from '../ui/ToastContainer'
import { ModalContainer } from '../ui/ModalContainer'
import { NetworkStatusIndicator } from '../ui/NetworkStatusIndicator'
import { useAppInitialization } from '@/stores'

export interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, initializeApp } = useAppInitialization()

  useEffect(() => {
    if (isAuthenticated) initializeApp().catch(console.error)
  }, [isAuthenticated, initializeApp])

  return (
    <div className="min-h-svh flex bg-background">
      <AppSidebar />
      <main className="flex-1 ml-[72px] overflow-y-auto">
        {children}
      </main>
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}
