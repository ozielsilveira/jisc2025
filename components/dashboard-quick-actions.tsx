'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Calendar, Medal, Ticket, Trophy, Users } from 'lucide-react'
import Link from 'next/link'

type UserRole = 'buyer' | 'athlete' | 'athletic' | 'admin'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  color: string
  href: string
  roles: UserRole[]
}

interface DashboardQuickActionsProps {
  userData: {
    role: UserRole
  } | null
}

export default function DashboardQuickActions({ userData }: DashboardQuickActionsProps) {
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

  const filteredActions = quickActions.filter((action) => action.roles.includes(userData?.role || 'buyer'))

  return (
    <div className='space-y-4'>
      <h2 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>Ações Rápidas</h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.id} href={action.href}>
              <Card className='group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 overflow-hidden focus-ring'>
                <div className={`h-2 bg-gradient-to-r ${action.color}`}></div>
                <CardContent className='p-6'>
                  <div className='flex items-start space-x-4'>
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className='h-6 w-6 text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-[#0456FC] transition-colors truncate'>
                        {action.title}
                      </h3>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 text-ellipsis-2'>
                        {action.description}
                      </p>
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
    </div>
  )
}
