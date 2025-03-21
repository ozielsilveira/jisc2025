"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface CountdownTimerProps {
  targetDate: Date
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Função para calcular o tempo restante
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Calcular imediatamente
    calculateTimeLeft()

    // Configurar o intervalo
    const timer = setInterval(calculateTimeLeft, 1000)

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(timer)
  }, [targetDate]) // Dependência correta

  return (
    <div className="flex flex-col items-center">
      <p className="text-lg md:text-xl font-semibold mb-4">O campeonato começa em:</p>
      <div className="flex space-x-4 md:space-x-6">
        <TimeUnit value={timeLeft.days} label="Dias" />
        <TimeUnit value={timeLeft.hours} label="Horas" />
        <TimeUnit value={timeLeft.minutes} label="Minutos" />
        <TimeUnit value={timeLeft.seconds} label="Segundos" />
      </div>
    </div>
  )
}

// Componente separado para cada unidade de tempo
function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg transform hover:scale-105 transition-transform">
      <CardContent className="flex flex-col items-center justify-center p-3 md:p-4">
        <span className="text-2xl md:text-4xl font-bold">{value.toString().padStart(2, "0")}</span>
        <span className="text-xs md:text-sm mt-1">{label}</span>
      </CardContent>
    </Card>
  )
}

