// src/hooks/useHomePageData.ts
import { useEffect, useState } from 'react'
import { dashboardService } from '@/services/dashboardService'

export function useHomePageData(user: { id: string } | null) {
  const [userData, setUserData] = useState<null | {
    id: string
    name: string
    role: 'buyer' | 'athlete' | 'athletic' | 'admin'
  }>(null)
  const [highlights, setHighlights] = useState<
    Array<{
      id: string
      title: string
      description: string
      date: string
      location: string
      image: string
      type: 'game' | 'event' | 'news'
      featured: boolean
    }>
  >([])
  const [stats, setStats] = useState({
    totalParticipants: 0,
    athleticCounter: 0,
    sportsAvailable: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      try {
        const [userInfo, generalStats, events] = await Promise.all([
          dashboardService.fetchUser(user.id),
          dashboardService.fetchGeneralStats(),
          dashboardService.fetchHighlights()
        ])
        setUserData(userInfo)
        setStats(generalStats)
        setHighlights(events)
      } catch (err) {
        console.warn('Failed to load dashboard data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [user])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % highlights.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + highlights.length) % highlights.length)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'athletic':
        return 'Representante de Atlética'
      case 'athlete':
        return 'Atleta'
      case 'buyer':
        return 'Participante'
      default:
        return 'Usuário'
    }
  }

  return {
    userData,
    highlights,
    stats,
    isLoading,
    currentSlide,
    nextSlide,
    prevSlide,
    getGreeting,
    getRoleDisplayName
  }
}
