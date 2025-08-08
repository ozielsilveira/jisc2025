'use client'

import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Calendar, Medal, Ticket, Trophy, Users, ArrowRight, Play, Star, MapPin, Clock, ChevronLeft, ChevronRight, Zap, Target, Award, Heart, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

      const { count: athleticsCount } = await supabase
        .from('athletics')
        .select('*', { count: 'exact', head: true })

      const { count: sportsCount } = await supabase
        .from('sports')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalParticipants: athletesCount || 0,
        athleticCounter: athleticsCount || 0,
        sportsAvailable: sportsCount || 0
      })
    } catch (error) {
      console.warn('Error fetching stats:', error)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'participate',
      title: 'Participar como Atleta',
      description: 'Cadastre-se e participe das competições',
      icon: Medal,
      color: 'from-blue-500 to-blue-600',
      href: '/dashboard/profile',
      roles: ['athlete', 'buyer']
    },
    {
      id: 'events',
      title: 'Ver Eventos',
      description: 'Confira a programação completa',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      href: '/dashboard/games',
      roles: ['buyer', 'athlete', 'athletic', 'admin']
    },
    {
      id: 'tickets',
      title: 'Comprar Ingressos',
      description: 'Garante seu lugar nos jogos',
      icon: Ticket,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard/tickets',
      roles: ['buyer', 'athlete']
    },
    {
      id: 'manage',
      title: 'Gerenciar Atletas',
      description: 'Administre sua equipe',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      href: '/dashboard/athletes',
      roles: ['athletic', 'admin']
    },
    {
      id: 'results',
      title: 'Resultados',
      description: 'Veja os resultados das partidas',
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      href: '/dashboard/results',
      roles: ['buyer', 'athlete', 'athletic', 'admin']
    }
  ]

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
      case 'admin': return 'Administrador'
      case 'athletic': return 'Representante de Atlética'
      case 'athlete': return 'Atleta'
      case 'buyer': return 'Participante'
      default: return 'Usuário'
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
              <Badge variant="secondary" className='bg-white/20 text-white border-white/30'>
                JISC 2024
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

      {/* Stats Overview */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
        <Card className='text-center hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-blue-50 to-blue-100'>
          <CardContent className='pt-6'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mb-4'>
              <Users className='h-6 w-6 text-white' />
            </div>
            <div className='text-2xl font-bold text-blue-700 mb-1'>{stats.totalParticipants}+</div>
            <p className='text-sm text-blue-600'>Atletas Participando</p>
          </CardContent>
        </Card>

        <Card className='text-center hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-green-50 to-green-100'>
          <CardContent className='pt-6'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-4'>
              <Calendar className='h-6 w-6 text-white' />
            </div>
            <div className='text-2xl font-bold text-green-700 mb-1'>{stats.athleticCounter}</div>
            <p className='text-sm text-green-600'>Total de Atléticas</p>
          </CardContent>
        </Card>

        <Card className='text-center hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-purple-50 to-purple-100'>
          <CardContent className='pt-6'>
            <div className='inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mb-4'>
              <Trophy className='h-6 w-6 text-white' />
            </div>
            <div className='text-2xl font-bold text-purple-700 mb-1'>{stats.sportsAvailable}</div>
            <p className='text-sm text-purple-600'>Modalidades</p>
          </CardContent>
        </Card>
      </div>

      {/* Highlights Carousel */}
      {highlights.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-bold text-gray-900'>Destaques</h2>
            <div className='flex space-x-2'>
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className='h-8 w-8'
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className='h-8 w-8'
              >
                <ChevronRight className='h-4 w-4' />
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
                    <div className='relative h-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200'>
                      <Image
                        src={highlight.image || "/placeholder.svg"}
                        alt={highlight.title}
                        fill
                        className='object-cover'
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent'></div>
                      <div className='absolute bottom-0 left-0 right-0 p-6 text-white'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <Badge 
                            className={`${
                              highlight.type === 'game' ? 'bg-green-500' :
                              highlight.type === 'event' ? 'bg-blue-500' :
                              'bg-purple-500'
                            }`}
                          >
                            {highlight.type === 'game' ? 'Jogo' :
                             highlight.type === 'event' ? 'Evento' : 'Novidade'}
                          </Badge>
                          {highlight.featured && (
                            <Badge className='bg-yellow-500'>
                              <Star className='h-3 w-3 mr-1' />
                              Destaque
                            </Badge>
                          )}
                        </div>
                        <h3 className='text-xl sm:text-2xl font-bold mb-2'>{highlight.title}</h3>
                        <p className='text-gray-200 mb-3'>{highlight.description}</p>
                        <div className='flex items-center space-x-4 text-sm text-gray-300'>
                          <div className='flex items-center space-x-1'>
                            <Clock className='h-4 w-4' />
                            <span>{highlight.date}</span>
                          </div>
                          <div className='flex items-center space-x-1'>
                            <MapPin className='h-4 w-4' />
                            <span>{highlight.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel indicators */}
          <div className='flex justify-center space-x-2'>
            {highlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-[#0456FC]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {/* <div className='space-y-4'>
        <h2 className='text-2xl font-bold text-gray-900'>Ações Rápidas</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {quickActions
            .filter(action => action.roles.includes(userData?.role || 'buyer'))
            .map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.id} href={action.href}>
                  <Card className='group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 overflow-hidden'>
                    <div className={`h-2 bg-gradient-to-r ${action.color}`}></div>
                    <CardContent className='p-6'>
                      <div className='flex items-start space-x-4'>
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className='h-6 w-6 text-white' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-gray-900 mb-1 group-hover:text-[#0456FC] transition-colors'>
                            {action.title}
                          </h3>
                          <p className='text-sm text-gray-600 mb-3'>{action.description}</p>
                          <div className='flex items-center text-[#0456FC] text-sm font-medium'>
                            <span>Acessar</span>
                            <ArrowRight className='h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform' />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
        </div>
      </div> */}

      {/* News & Updates */}
      {/* <div className='space-y-4'>
        <h2 className='text-2xl font-bold text-gray-900'>Novidades</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card className='hover:shadow-lg transition-shadow border-l-4 border-l-blue-500'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <Sparkles className='h-5 w-5 text-blue-500' />
                <CardTitle className='text-lg'>Sorteio de Prêmios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 mb-4'>
                Além da glória de vencer, os campeões de cada modalidade ainda ganharão prêmios incríveis!
              </p>
              <Button variant="outline" size="sm">
                Veja quais prêmios
                <ArrowRight className='h-4 w-4 ml-1' />
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-lg transition-shadow border-l-4 border-l-blue-500'>
            <CardHeader>
              <div className='flex items-center space-x-2'>
                <Zap className='h-5 w-5 text-blue-500' />
                <CardTitle className='text-lg'>Novas Modalidades</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600 mb-4'>
                Adicionamos novas modalidades esportivas para tornar a competição ainda mais emocionante.
              </p>
              <Button variant="outline" size="sm">
                Ver Modalidades
                <ArrowRight className='h-4 w-4 ml-1' />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div> */}

      {/* Role-specific Welcome Message */}
      <Card className='bg-gradient-to-r from-gray-50 to-gray-100 border-0'>
        <CardContent className='p-8 text-center'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-[#0456FC] rounded-full mb-4'>
            <Heart className='h-8 w-8 text-white' />
          </div>
          <h3 className='text-xl font-bold text-gray-900 mb-2'>
            Obrigado por fazer parte do JISC!
          </h3>
          <p className='text-gray-600 max-w-2xl mx-auto'>
            Como {getRoleDisplayName(userData?.role || 'buyer').toLowerCase()}, você é parte essencial 
            do maior campeonato universitário do país. Juntos, fazemos a diferença no esporte universitário.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
