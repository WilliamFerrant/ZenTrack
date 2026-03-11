// Main application layout with navigation and header
'use client'

import { ReactNode, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '../ui/ToastContainer'
import { ModalContainer } from '../ui/ModalContainer'
import { NetworkStatusIndicator } from '../ui/NetworkStatusIndicator'
import { useDataStore, useAppInitialization } from '@/stores'

export interface AppLayoutProps {
  children: ReactNode
  title?: string
  showSidebar?: boolean
}

export function AppLayout({ children, title, showSidebar = false }: AppLayoutProps) {
  const { isAuthenticated, initializeApp } = useAppInitialization()

  // Initialize app data when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeApp().catch(error => {
        console.error('Failed to initialize app:', error)
      })
    }
  }, [isAuthenticated, initializeApp])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex">
        {/* Main Content */}
        <main className="flex-1">
          {/* Page Header */}
          {title && (
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="py-6">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate">
                    {title}
                  </h1>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global UI Components */}
      <ToastContainer />
      <ModalContainer />
      <NetworkStatusIndicator />
    </div>
  )
}