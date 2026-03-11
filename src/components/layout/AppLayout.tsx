'use client'

import { ReactNode, useEffect } from 'react'
import AppSidebar from '../zen/AppSidebar'
import ZenTopBar  from '../zen/ZenTopBar'
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
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <ZenTopBar />
        <div className="flex-1 p-4 lg:p-6 xl:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}
