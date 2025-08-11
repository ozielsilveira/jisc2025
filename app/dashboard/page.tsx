'use client'

import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Play, Award, Heart, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

import { LazyDashboardSections } from '@/components/lazy-dashboard-sections'

type UserRole = 'buyer' | 'athlete' | 'athletic' | 'admin'

type UserData = {
  id: string
  name: string
  role: UserRole
}

type HighlightEvent = {
  id: string
  title: string
  description: string
  date: string
  location: string
  image: string
  type: 'game' | 'event' | 'news'
  featured: boolean
}

type QuickAction = {
  id: string
  title: string
  description: string
  icon: any
  color: string
  href: string
  roles: UserRole[]
}

export default function HomePage() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [highlights, setHighlights] = useState<HighlightEvent[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalParticipants: 0,
    athleticCounter: 0,
    sportsAvailable: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch user data
        const { data: userInfo, error } = await supabase
          .from('users')
          .select('id, name, role')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setUserData(userInfo as UserData)

        // Fetch highlights and general stats
        await fetchHighlights()
        await fetchGeneralStats()
      } catch (error) {
        console.warn('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user])

  const fetchHighlights = async () => {
    try {
      // Fetch upcoming games as highlights
      // const { data: games } = await supabase
      //   .from('games')
      //   .select(`
      //     id,
      //     start_time,
      //     location,
      //     sport:sports(name),
      //     participants:game_participants(
      //       athletic:athletics(name)
      //     )
      //   `)
      //   .gte('start_time', new Date().toISOString())
      //   .order('start_time', { ascending: true })
      //   .limit(5)

      // const gameHighlights: HighlightEvent[] = games?.map((game, index) => ({
      //   id: game.id,
      //   title: `${game.sport.name} - Próxima Partida`,
      //   description: `${game.participants.map(p => p.athletic.name).join(' vs ')}`,
      //   date: new Date(game.start_time).toLocaleDateString('pt-BR'),
      //   location: game.location || 'Local a definir',
      //   image: `/trofeu.jpg?height=300&width=500&text=${game.sport.name}`,
      //   type: 'game',
      //   featured: index === 0
      // })) || []

      // Add some general highlights
      const generalHighlights: HighlightEvent[] = [
        {
          id: 'welcome',
          title: 'Bem-vindo ao JISC 2025!',
          description: 'O maior campeonato universitário está acontecendo. Participe e mostre seu talento!',
          date: 'Evento em andamento',
          location: 'Campus Universitário',
          image: '/festa1.jpg?height=300&width=500&text=JISC+2025',
          type: 'event',
          featured: true
        },
        {
          id: 'registration',
          title: 'Inscrições Abertas',
          description: 'Cadastre-se como atleta e participe das modalidades disponíveis.',
          date: 'Até 29/08/2025',
          location: 'Online',
          image: '/trofeu.jpg?height=300&width=500&text=Inscricoes+Abertas',
          type: 'news',
          featured: false
        }
      ]
      setHighlights([...generalHighlights])
    } catch (error) {
      console.warn('Error fetching highlights:', error)
      setHighlights([])
    }
  }

  const fetchGeneralStats = async () => {
    try {
      const { count: athletesCount } = await supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
      const { count: athleticsCount } = await supabase.from('athletics').select('*', { count: 'exact', head: true })
      const { count: sportsCount } = await supabase.from('sports').select('*', { count: 'exact', head: true })

      setStats({
        totalParticipants: athletesCount || 0,
        athleticCounter: athleticsCount || 0,
        sportsAvailable: sportsCount || 0
      })
    } catch (error) {
      console.warn('Error fetching stats:', error)
    }
  }

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

  const getRoleDisplayName = (role: UserRole) => {
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
    <div className='space-y-8 max-w-7xl mx-auto'>
      {/* Hero Section */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0456FC] via-[#0345D1] to-[#0234B8] text-white'>
        <div className='absolute inset-0 bg-black/10'></div>
        <div className='relative px-6 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20'>
          <div className='max-w-4xl'>
            <div className='flex items-center space-x-2 mb-4'>
              <Sparkles className='h-6 w-6 text-yellow-300' />
              <Badge variant='secondary' className='bg-white/20 text-white border-white/30'>
                JISC 2025
              </Badge>
            </div>
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold mb-4'>
              {getGreeting()}, {userData?.name}!
            </h1>
            <p className='text-lg sm:text-xl text-blue-100 mb-6 max-w-2xl'>
              Bem-vindo ao maior campeonato universitário do sul de Santa Catarina.
              {userData?.role === 'athlete' && ' Mostre seu talento e conquiste sua vitória!'}
              {userData?.role === 'athletic' && ' Gerencie sua equipe e leve-a ao topo!'}
              {userData?.role === 'admin' && ' Administre o campeonato com excelência!'}
              {userData?.role === 'buyer' && ' Acompanhe os melhores jogos e torça pelo seu time!'}
            </p>
          </div>
        </div>
        {/* Decorative elements */}
        <div className='absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full'></div>
        <div className='absolute bottom-0 right-12 -mb-8 w-16 h-16 bg-yellow-300/20 rounded-full'></div>
      </div>

      {/* CTA for Athletes to complete registration */}
      {userData?.role === 'athlete' && (
        <Card className='border-2 border-[#0456FC] bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'>
          <CardContent className='p-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6'>
            <div className='flex items-center space-x-4'>
              <Award className='h-10 w-10 text-[#0456FC] flex-shrink-0' />
              <div>
                <CardTitle className='text-xl font-bold text-gray-900'>Complete seu Cadastro de Atleta!</CardTitle>
                <CardDescription className='text-gray-700 mt-1'>
                  Para participar das modalidades e competições, finalize seu registro. É rápido e fácil!
                </CardDescription>
              </div>
            </div>
            <Link href='/dashboard/profile' passHref>
              <Button className='w-full sm:w-auto bg-gradient-to-r from-[#0456FC] to-[#0345D1] hover:from-[#0345D1] hover:to-[#0234B8] text-white font-bold py-3 px-6 text-base transition-all duration-200 shadow-md'>
                <Play className='h-5 w-5 mr-2' />
                Finalizar Cadastro
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <LazyDashboardSections userData={userData} stats={stats} highlights={highlights} />

      {/* Role-specific Welcome Message */}
      <Card className='bg-gradient-to-r from-gray-50 to-gray-100 border-0'>
        <CardContent className='p-8 text-center'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-[#0456FC] rounded-full mb-4'>
            <Heart className='h-8 w-8 text-white' />
          </div>
          <h3 className='text-xl font-bold text-gray-900 mb-2'>Obrigado por fazer parte do JISC!</h3>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Como {getRoleDisplayName(userData?.role || 'buyer').toLowerCase()}, você é parte essencial do maior
            campeonato universitário do país. Juntos, fazemos a diferença no esporte universitário.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
