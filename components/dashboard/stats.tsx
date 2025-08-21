'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Trophy, Users } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    totalParticipants: number
    athleticCounter: number
    sportsAvailable: number
  }
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
      <Card className='text-center hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'>
        <CardContent className='pt-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mb-4'>
            <Users className='h-6 w-6 text-white' />
          </div>
          <div className='text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1'>{stats.totalParticipants}+</div>
          <p className='text-sm text-blue-600 dark:text-blue-400'>Atletas Participando</p>
        </CardContent>
      </Card>
      <Card className='text-center hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'>
        <CardContent className='pt-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-4'>
            <Calendar className='h-6 w-6 text-white' />
          </div>
          <div className='text-2xl font-bold text-green-700 dark:text-green-300 mb-1'>{stats.athleticCounter}</div>
          <p className='text-sm text-green-600 dark:text-green-400'>Total de Atléticas</p>
        </CardContent>
      </Card>
      <Card className='text-center hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'>
        <CardContent className='pt-6'>
          <div className='inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mb-4'>
            <Trophy className='h-6 w-6 text-white' />
          </div>
          <div className='text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1'>{stats.sportsAvailable}</div>
          <p className='text-sm text-purple-600 dark:text-purple-400'>Modalidades</p>
        </CardContent>
      </Card>
    </div>
  )
}
