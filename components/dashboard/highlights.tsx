'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Clock, MapPin, Star } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'

interface HighlightEvent {
  id: string
  title: string
  description: string
  date: string
  location: string
  image: string
  type: 'game' | 'event' | 'news'
  featured: boolean
}

interface DashboardHighlightsProps {
  highlights: HighlightEvent[]
}

export default function DashboardHighlights({ highlights }: DashboardHighlightsProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % highlights.length)
  }, [highlights.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + highlights.length) % highlights.length)
  }, [highlights.length])

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>Destaques</h2>
        <div className='flex space-x-2'>
          <Button variant='outline' size='icon' onClick={prevSlide} className='h-8 w-8 focus-ring bg-transparent'>
            <ChevronLeft className='h-4 w-4' />
            <span className='sr-only'>Destaque anterior</span>
          </Button>
          <Button variant='outline' size='icon' onClick={nextSlide} className='h-8 w-8 focus-ring bg-transparent'>
            <ChevronRight className='h-4 w-4' />
            <span className='sr-only'>Próximo destaque</span>
          </Button>
        </div>
      </div>
      <div className='relative overflow-hidden rounded-xl'>
        <div
          className='flex transition-transform duration-500 ease-in-out'
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {highlights.map((highlight) => (
            <div key={highlight.id} className='w-full flex-shrink-0'>
              <Card className='border-0 shadow-lg overflow-hidden'>
                <div className='relative h-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'>
                  <Image
                    src={highlight.image || '/placeholder.svg?height=320&width=800&text=JISC+Destaque'}
                    alt={highlight.title}
                    fill
                    className='object-cover'
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw'
                    priority={currentSlide === 0}
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent'></div>
                  <div className='absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Badge
                        className={`${
                          highlight.type === 'game'
                            ? 'bg-green-500'
                            : highlight.type === 'event'
                              ? 'bg-blue-500'
                              : 'bg-purple-500'
                        }`}
                      >
                        {highlight.type === 'game' ? 'Jogo' : highlight.type === 'event' ? 'Evento' : 'Novidade'}
                      </Badge>
                      {highlight.featured && (
                        <Badge className='bg-yellow-500'>
                          <Star className='h-3 w-3 mr-1' />
                          Destaque
                        </Badge>
                      )}
                    </div>
                    <h3 className='text-lg sm:text-xl md:text-2xl font-bold mb-2 text-ellipsis-2'>{highlight.title}</h3>
                    <p className='text-gray-200 mb-3 text-sm sm:text-base text-ellipsis-2'>{highlight.description}</p>
                    <div className='flex items-center space-x-4 text-xs sm:text-sm text-gray-300'>
                      <div className='flex items-center space-x-1'>
                        <Clock className='h-4 w-4 flex-shrink-0' />
                        <span className='truncate'>{highlight.date}</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <MapPin className='h-4 w-4 flex-shrink-0' />
                        <span className='truncate'>{highlight.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <div className='flex justify-center space-x-2'>
        {highlights.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors focus-ring ${
              index === currentSlide ? 'bg-[#0456FC]' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label={`Ver destaque ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
