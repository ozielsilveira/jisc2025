'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import DashboardSidebar from '@/components/dashboard-sidebar'
import { ThemeProvider } from '@/contexts/theme-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary'></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ThemeProvider>
      <div className='flex h-screen bg-gray-100 dark:bg-gray-900'>
        <DashboardSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className='flex-1 overflow-auto transition-all duration-300 ease-in-out md:ml-64'>
          {/* Add a top padding on mobile to account for the fixed header button */}
          <div className='pt-16 md:pt-0'>
            <main className='p-4 sm:p-6 lg:p-8'>{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
