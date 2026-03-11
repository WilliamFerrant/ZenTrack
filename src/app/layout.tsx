import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthInitializer } from '@/components/auth/AuthInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zentracker - Time Tracking Made Simple',
  description: 'Professional time tracking application for teams and individuals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthInitializer>
          {children}
        </AuthInitializer>
      </body>
    </html>
  )
}