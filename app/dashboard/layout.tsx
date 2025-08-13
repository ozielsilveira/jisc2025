'use client'

import { useAuth } from '@/components/auth-provider'
import { CacheDebug } from '@/components/cache-debug'
import DashboardSidebar from '@/components/dashboard-sidebar'
import MobileHeader from '@/components/mobile-header'
import { ThemeProvider } from '@/contexts/theme-context'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { Suspense, useEffect, useState } from 'react'

function LoadingSpinner() {
  return (
    <div className='flex h-screen items-center justify-center bg-background'>
      <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary'></div>
    </div>
  )
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <LoadingSpinner />
  }

  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (window.innerWidth >= 768) {
          setIsMobileMenuOpen(false)
        }
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true)
    const handleRouteChangeComplete = () => setIsNavigating(false)

    const handleBeforeUnload = () => setIsNavigating(true)

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <ThemeProvider>
      <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900 safe-top safe-bottom'>
        {/* Sidebar */}
        <DashboardSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        {/* Main Content Area */}
        <div className='flex flex-col flex-1 min-w-0 relative'>
          {/* Mobile Header */}
          <MobileHeader onMenuToggle={() => setIsMobileMenuOpen(true)} />

          {isNavigating && (
            <div className='absolute inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center'>
              <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-primary'></div>
            </div>
          )}

          <main className='flex-1 pt-16 md:pt-0 overflow-y-auto'>
            <div className='w-full min-h-full'>
              <Suspense fallback={<LoadingSpinner />}>
                <ContentWrapper>{children}</ContentWrapper>
              </Suspense>
            </div>
          </main>
        </div>

        {/* Cache Debug Component (only in development) */}
        {process.env.NODE_ENV === 'development' && <CacheDebug />}
      </div>
    </ThemeProvider>
  )
}
