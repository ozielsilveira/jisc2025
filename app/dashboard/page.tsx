// src/app/home/page.tsx
'use client'

import { useAuth } from '@/components/auth-provider'
import { LazyDashboardSections } from '@/components/lazy-dashboard-sections'
import { useHomePageData } from '@/hooks/use-home-page-data'
import { Card, CardContent } from '@/components/ui/card'
import { Heart } from 'lucide-react'
import { HeroSection } from '@/components/dashboard/hero-section'
import { AthleteRegistrationCTA } from '@/components/dashboard/athlete-registration-cta'

export default function HomePage() {
  const { user } = useAuth()
  const {
    userData,
    highlights,
    stats,
    isLoading,
    currentSlide,
    nextSlide,
    prevSlide,
    getGreeting,
    getRoleDisplayName
  } = useHomePageData(user)

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]'></div>
          <p className='text-sm text-gray-500'>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='space-y-6 sm:space-y-8 max-w-7xl mx-auto'>
        {/* Seção principal */}
        <HeroSection userName={userData?.name} greeting={getGreeting()} role={userData?.role} />
        {/* CTA para atletas */}
        <AthleteRegistrationCTA visible={userData?.role === 'athlete'} />
        {/* Seções do dashboard (lazy) */}
        <LazyDashboardSections userData={userData} stats={stats} highlights={highlights} />
        {/* Mensagem final */}
        <Card className='bg-gradient-to-r from-gray-50 to-gray-100 border-0'>
          <CardContent className='p-6 sm:p-8 text-center'>
            <div className='inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#0456FC] rounded-full mb-3 sm:mb-4'>
              <Heart className='h-6 w-6 sm:h-8 sm:w-8 text-white' />
            </div>
            <h3 className='text-lg sm:text-xl font-bold text-gray-900 mb-2'>Obrigado por fazer parte do JISC!</h3>
            <p className='text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed'>
              Como {getRoleDisplayName(userData?.role ?? 'buyer').toLowerCase()}, você é parte essencial do maior
              campeonato universitário do país. Juntos, fazemos a diferença no esporte universitário.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
