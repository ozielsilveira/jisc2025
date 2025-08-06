'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  targetDate: Date
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
      <div className='bg-black/20 backdrop-blur-md p-4 rounded-xl text-center transform hover:scale-105 transition-transform'>
        <div className='text-4xl font-bold'>{timeLeft.days}</div>
        <div className='text-sm uppercase mt-1'>Dias</div>
      </div>
      <div className='bg-black/20 backdrop-blur-md p-4 rounded-xl text-center transform hover:scale-105 transition-transform'>
        <div className='text-4xl font-bold'>{timeLeft.hours}</div>
        <div className='text-sm uppercase mt-1'>Horas</div>
      </div>
      <div className='bg-black/20 backdrop-blur-md p-4 rounded-xl text-center transform hover:scale-105 transition-transform'>
        <div className='text-4xl font-bold'>{timeLeft.minutes}</div>
        <div className='text-sm uppercase mt-1'>Minutos</div>
      </div>
      <div className='bg-black/20 backdrop-blur-md p-4 rounded-xl text-center transform hover:scale-105 transition-transform'>
        <div className='text-4xl font-bold'>{timeLeft.seconds}</div>
        <div className='text-sm uppercase mt-1'>Segundos</div>
      </div>
    </div>
  )
}
