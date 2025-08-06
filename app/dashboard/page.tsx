'use client'

import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Calendar, Medal, Ticket, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

type UserRole = 'buyer' | 'athlete' | 'athletic' | 'admin'

type UserData = {
  id: string
  name: string
  role: UserRole
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [stats, setStats] = useState({
    totalAthletes: 0,
    totalAthletics: 0,
    upcomingGames: 0,
    ticketsSold: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from('users').select('id, name, role').eq('id', user.id).single()
        if (error) throw error
        setUserData(data as UserData)

        // Fetch stats based on user role
        if (data.role === 'admin') {
          await fetchAdminStats()
        } else if (data.role === 'athletic') {
          await fetchAthleticStats(data.id)
        } else if (data.role === 'athlete') {
          await fetchAthleteStats(data.id)
        } else {
          await fetchBuyerStats(data.id)
        }
      } catch (error) {
        console.warn('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const fetchAdminStats = async () => {
    try {
      const { count: athletesCount } = await supabase.from('athletes').select('*', { count: 'exact', head: true })
      const { count: athleticsCount } = await supabase.from('athletics').select('*', { count: 'exact', head: true })
      const { count: gamesCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', new Date().toISOString())
      const { count: ticketsCount } = await supabase
        .from('ticket_purchases')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalAthletes: athletesCount || 0,
        totalAthletics: athleticsCount || 0,
        upcomingGames: gamesCount || 0,
        ticketsSold: ticketsCount || 0
      })
    } catch (error) {
      console.warn('Error fetching admin stats:', error)
    }
  }

  const fetchAthleticStats = async (athleticId: string) => {
    try {
      const { count: athletesCount } = await supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })
        .eq('athletic_id', athleticId)
      const { count: gamesCount } = await supabase
        .from('game_participants')
        .select('game_id', { count: 'exact', head: true })
        .eq('athletic_id', athleticId)
      const { count: ticketsCount } = await supabase
        .from('ticket_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('athletic_referral_id', athleticId)

      setStats({
        totalAthletes: athletesCount || 0,
        totalAthletics: 1,
        upcomingGames: gamesCount || 0,
        ticketsSold: ticketsCount || 0
      })
    } catch (error) {
      console.warn('Error fetching athletic stats:', error)
    }
  }

  const fetchAthleteStats = async (userId: string) => {
    try {
      const { data: athleteData } = await supabase
        .from('athletes')
        .select('id, athletic_id')
        .eq('user_id', userId)
        .single()

      if (!athleteData) return

      const { data: athleteSports } = await supabase
        .from('athlete_sports')
        .select('sport_id')
        .eq('athlete_id', athleteData.id)

      const sportIds = athleteSports?.map((item) => item.sport_id) || []

      let gamesCount = 0
      if (sportIds.length > 0) {
        const { count } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .in('sport_id', sportIds)
          .gte('start_time', new Date().toISOString())
        gamesCount = count || 0
      }

      setStats({
        totalAthletes: 1,
        totalAthletics: 1,
        upcomingGames: gamesCount,
        ticketsSold: 0
      })
    } catch (error) {
      console.warn('Error fetching athlete stats:', error)
    }
  }

  const fetchBuyerStats = async (userId: string) => {
    try {
      const { count: ticketsCount } = await supabase
        .from('ticket_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      setStats({
        totalAthletes: 0,
        totalAthletics: 0,
        upcomingGames: 0,
        ticketsSold: ticketsCount || 0
      })
    } catch (error) {
      console.warn('Error fetching buyer stats:', error)
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 text-sm sm:text-base'>
          Bem-vindo, {userData?.name}! Aqui está um resumo das suas informações.
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-gray-700'>Atletas</CardTitle>
            <Medal className='h-4 w-4 text-gray-500 flex-shrink-0' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900'>{stats.totalAthletes}</div>
            <p className='text-xs text-gray-500 mt-1'>
              {userData?.role === 'admin'
                ? 'Total de atletas cadastrados'
                : userData?.role === 'athletic'
                  ? 'Atletas na sua atlética'
                  : 'Seu perfil de atleta'}
            </p>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-gray-700'>Atléticas</CardTitle>
            <Trophy className='h-4 w-4 text-gray-500 flex-shrink-0' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900'>{stats.totalAthletics}</div>
            <p className='text-xs text-gray-500 mt-1'>
              {userData?.role === 'admin' ? 'Total de atléticas participantes' : 'Sua atlética'}
            </p>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-gray-700'>Jogos</CardTitle>
            <Calendar className='h-4 w-4 text-gray-500 flex-shrink-0' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900'>{stats.upcomingGames}</div>
            <p className='text-xs text-gray-500 mt-1'>
              {userData?.role === 'admin'
                ? 'Total de jogos agendados'
                : userData?.role === 'athletic'
                  ? 'Jogos da sua atlética'
                  : userData?.role === 'athlete'
                    ? 'Seus jogos agendados'
                    : 'Jogos do campeonato'}
            </p>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium text-gray-700'>Ingressos</CardTitle>
            <Ticket className='h-4 w-4 text-gray-500 flex-shrink-0' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900'>{stats.ticketsSold}</div>
            <p className='text-xs text-gray-500 mt-1'>
              {userData?.role === 'admin'
                ? 'Total de ingressos vendidos'
                : userData?.role === 'athletic'
                  ? 'Ingressos vendidos pela sua atlética'
                  : 'Seus ingressos comprados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific content */}
      <div className='space-y-6'>
        {userData?.role === 'admin' && (
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg sm:text-xl'>Visão Geral do Campeonato</CardTitle>
              <CardDescription>Informações gerais sobre o andamento do JISC</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>Painel administrativo com visão geral do campeonato.</p>
            </CardContent>
          </Card>
        )}

        {userData?.role === 'athletic' && (
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg sm:text-xl'>Gerenciamento da Atlética</CardTitle>
              <CardDescription>Informações sobre seus atletas e jogos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>Painel de gerenciamento da atlética.</p>
            </CardContent>
          </Card>
        )}

        {userData?.role === 'athlete' && (
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg sm:text-xl'>Meus Jogos</CardTitle>
              <CardDescription>Próximos jogos e modalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>Informações sobre seus próximos jogos.</p>
            </CardContent>
          </Card>
        )}

        {userData?.role === 'buyer' && (
          <Card className='hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='text-lg sm:text-xl'>Meus Ingressos</CardTitle>
              <CardDescription>Ingressos comprados para eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>Detalhes dos seus ingressos para a festa.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
