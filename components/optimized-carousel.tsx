'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface TestimonialData {
  id: number
  name: string
  role: string
  avatar: string
  content: string
  rating: number
}

const testimonials: TestimonialData[] = [
  {
    id: 1,
    name: 'Mariana Silva',
    role: 'Atlética de Medicina',
    avatar: 'M',
    content:
      'Participar do JISC foi uma experiência incrível! Além das competições, fiz amizades que vou levar para a vida toda.',
    rating: 5
  },
  {
    id: 2,
    name: 'Rafael Oliveira',
    role: 'Atlética de Engenharia',
    avatar: 'R',
    content:
      'O nível de organização do JISC é impressionante. A plataforma facilitou muito o acompanhamento dos jogos e a compra de ingressos.',
    rating: 5
  },
  {
    id: 3,
    name: 'Juliana Costa',
    role: 'Atlética de Direito',
    avatar: 'J',
    content:
      'As competições são acirradas, mas o espírito esportivo prevalece. A festa de encerramento é simplesmente inesquecível!',
    rating: 5
  },
  {
    id: 4,
    name: 'Pedro Santos',
    role: 'Atlética de Administração',
    avatar: 'P',
    content:
      'O JISC proporciona uma integração única entre os estudantes. É uma oportunidade incrível de networking e diversão.',
    rating: 4
  },
  {
    id: 5,
    name: 'Camila Ferreira',
    role: 'Atlética de Psicologia',
    avatar: 'C',
    content:
      'A organização do evento é impecável! Desde o processo de inscrição até a premiação, tudo é muito bem planejado e executado.',
    rating: 5
  }
]

export function OptimizedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }, [])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const currentTestimonial = useMemo(() => testimonials[currentIndex], [currentIndex])

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(nextTestimonial, 5000)
    return () => clearInterval(interval)
  }, [isPaused, nextTestimonial])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevTestimonial()
      } else if (event.key === 'ArrowRight') {
        nextTestimonial()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextTestimonial, prevTestimonial])

  return (
    <div
      className='relative'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role='region'
      aria-label='Carrossel de depoimentos'
    >
      <div className='overflow-hidden relative'>
        <div className='flex justify-center'>
          <div className='w-full max-w-4xl'>
            <div className='bg-[#07F2F2] dark:bg-gray-900 p-6 sm:p-8 md:p-12 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800'>
              <div className='flex flex-col md:flex-row gap-6 sm:gap-8 items-start'>
                <div className='flex-shrink-0'>
                  <div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#C200F7] to-[#9900c5] rounded-full flex items-center justify-center shadow-lg'>
                    <span className='text-white font-bold text-xl sm:text-2xl'>{currentTestimonial.avatar}</span>
                  </div>
                </div>

                <div className='flex-grow min-w-0'>
                  <div className='flex items-center mb-2'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          i < currentTestimonial.rating ? 'text-purple-500 fill-current' : 'text-purple-300'
                        }`}
                        aria-hidden='true'
                      />
                    ))}
                    <span className='sr-only'>{currentTestimonial.rating} de 5 estrelas</span>
                  </div>

                  <blockquote className='text-gray-700 dark:text-gray-300 text-base sm:text-lg italic mb-4 sm:mb-6'>
                    &quot;{currentTestimonial.content}&quot;
                  </blockquote>

                  <div>
                    <h4 className='font-bold text-lg sm:text-xl dark:text-white'>{currentTestimonial.name}</h4>
                    <p className='text-[#C200F7] text-sm sm:text-base'>{currentTestimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex justify-center mt-6 sm:mt-8 gap-2'>
        <Button
          variant='outline'
          size='icon'
          onClick={prevTestimonial}
          className='rounded-full border-gray-200 dark:border-gray-700 focus-ring bg-transparent'
          aria-label='Depoimento anterior'
        >
          <ChevronLeft className='h-4 w-4 sm:h-5 sm:w-5' />
        </Button>

        <div className='flex items-center gap-2' role='tablist' aria-label='Indicadores do carrossel'>
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all focus-ring ${
                index === currentIndex ? 'bg-[#C200F7] w-4' : 'bg-gray-300 dark:bg-gray-700'
              }`}
              aria-label={`Ver depoimento ${index + 1}`}
              role='tab'
              aria-selected={index === currentIndex}
            />
          ))}
        </div>

        <Button
          variant='outline'
          size='icon'
          onClick={nextTestimonial}
          className='rounded-full border-gray-200 dark:border-gray-700 focus-ring bg-transparent'
          aria-label='Próximo depoimento'
        >
          <ChevronRight className='h-4 w-4 sm:h-5 sm:w-5' />
        </Button>
      </div>
    </div>
  )
}
