// src/app/dashboard/layout.tsx
'use client'

import { Suspense, useState, useEffect } from 'react'
import { ThemeProvider } from '@/contexts/theme-context'
import DashboardSidebar from '@/components/dashboard/sidebar'
import MobileHeader from '@/components/mobile-header'
import { CacheDebug } from '@/components/cache-debug'
import { useRequireAuth } from '@/hooks/use-requireauth'
import { useResponsiveSidebar } from '@/hooks/use-responsive-sidebar'
import { useNavigationIndicator } from '@/hooks/use-navigation-indicator'

function LoadingSpinner() {
  return (
    <div className='flex h-screen items-center justify-center bg-background'>
      <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary'></div>
    </div>
  )
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])
  if (!isClient) return <LoadingSpinner />
  return <>{children}</>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useRequireAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Hooks para lidar com redimensionamento e indicador de navegação
  useResponsiveSidebar(setIsMobileMenuOpen)
  useNavigationIndicator(setIsNavigating)

  if (isLoading) return <LoadingSpinner />
  if (!user) return null

  return (
    <ThemeProvider>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 safe-top safe-bottom'>
        <DashboardSidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        {/* Conteúdo principal empurrado para a direita no desktop */}
        <div className='md:ml-64 flex flex-col flex-1 min-w-0 relative'>
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
        {process.env.NODE_ENV === 'development' && <CacheDebug />}
      </div>
    </ThemeProvider>
  )
}
