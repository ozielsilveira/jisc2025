'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import DashboardSidebar from '@/components/dashboard-sidebar'
import MobileHeader from '@/components/mobile-header'
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

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
        {/* Sidebar */}
        <DashboardSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        {/* Main Content Area */}
        <div className='flex flex-col flex-1 min-w-0'>
          {/* Mobile Header */}
          <MobileHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />

          {/* Main Content */}
          <main className='flex-1 overflow-auto'>
            <div className='h-full pt-16 md:pt-0'>
              <div className='p-4 sm:p-6 lg:p-8 h-full'>{children}</div>
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
