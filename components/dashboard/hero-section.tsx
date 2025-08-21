// src/components/HeroSection.tsx
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface HeroSectionProps {
  userName?: string | null
  greeting: string
  role?: 'buyer' | 'athlete' | 'athletic' | 'admin'
}

export function HeroSection({ userName, greeting, role }: HeroSectionProps) {
  return (
    <div className='relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0456FC] via-[#0345D1] to-[#0234B8] text-white'>
      <div className='absolute inset-0 bg-black/10'></div>
      <div className='relative px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16'>
        <div className='max-w-4xl'>
          <div className='flex items-center space-x-2 mb-3 sm:mb-4'>
            <Sparkles className='h-5 w-5 sm:h-6 sm:w-6 text-yellow-300 flex-shrink-0' />
            <Badge variant='secondary' className='bg-white/20 text-white border-white/30 text-xs sm:text-sm'>
              JISC 2025
            </Badge>
          </div>
          <h1 className='text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 leading-tight'>
            {greeting}, {userName ?? 'Visitante'}!
          </h1>
          <p className='text-base sm:text-lg lg:text-xl text-blue-100 mb-4 sm:mb-6 max-w-2xl leading-relaxed'>
            Bem-vindo ao maior campeonato universitário do sul de Santa Catarina.
            {role === 'athlete' && ' Mostre seu talento e conquiste sua vitória!'}
            {role === 'athletic' && ' Gerencie sua equipe e leve-a ao topo!'}
            {role === 'admin' && ' Administre o campeonato com excelência!'}
            {role === 'buyer' && ' Acompanhe os melhores jogos e torça pelo seu time!'}
          </p>
        </div>
      </div>
      <div className='absolute top-0 right-0 -mt-2 -mr-2 sm:-mt-4 sm:-mr-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full'></div>
      <div className='absolute bottom-0 right-6 sm:right-12 -mb-4 sm:-mb-8 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-300/20 rounded-full'></div>
    </div>
  )
}
