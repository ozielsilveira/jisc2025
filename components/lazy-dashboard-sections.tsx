'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const DashboardStats = dynamic(() => import('./dashboard/stats'), {
  loading: () => (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse' />
      ))}
    </div>
  ),
  ssr: false
})

const DashboardHighlights = dynamic(() => import('./dashboard/highlights'), {
  loading: () => <div className='h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse' />,
  ssr: false
})

const DashboardQuickActions = dynamic(() => import('./dashboard/quick-actions'), {
  loading: () => (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className='h-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse' />
      ))}
    </div>
  ),
  ssr: false
})

interface LazyDashboardSectionsProps {
  userData: any
  stats: any
  highlights: any[]
}

export function LazyDashboardSections({ userData, stats, highlights }: LazyDashboardSectionsProps) {
  return (
    <>
      <Suspense
        fallback={
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse' />
            ))}
          </div>
        }
      >
        <DashboardStats stats={stats} />
      </Suspense>

      {highlights.length > 0 && (
        <Suspense fallback={<div className='h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse' />}>
          <DashboardHighlights highlights={highlights} />
        </Suspense>
      )}

      <Suspense
        fallback={
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-40 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse' />
            ))}
          </div>
        }
      >
        {/* <DashboardQuickActions userData={userData} /> */}
      </Suspense>
    </>
  )
}
