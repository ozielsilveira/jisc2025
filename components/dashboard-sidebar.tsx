'use client'

import type React from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import * as Icons from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type UserRole = 'buyer' | 'athlete' | 'athletic' | 'admin'

interface DashboardSidebarProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export default function DashboardSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: DashboardSidebarProps) {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (error) throw error
        setUserRole(data.role as UserRole)
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    fetchUserRole()
  }, [user])

  const navItems = [
    {
      category: 'Principal',
      items: [
        { label: 'Dashboard', icon: 'Home', href: '/dashboard', roles: ['buyer', 'athlete', 'athletic', 'admin'] },
        { label: 'Cadastro', icon: 'User', href: '/dashboard/profile', roles: ['athlete'] }
      ]
    },
    {
      category: 'Gestão',
      items: [
        { label: 'Atletas', icon: 'Medal', href: '/dashboard/athletes', roles: ['athletic', 'admin'] },
        { label: 'Atléticas', icon: 'Trophy', href: '/dashboard/athletics', roles: ['admin'] },
        { label: 'Modalidades', icon: 'Users', href: '/dashboard/sports', roles: ['admin'] }
      ]
    },
    {
      category: 'Competição',
      items: [
        // { label: 'Jogos', icon: 'Calendar', href: '/dashboard/games', roles: ['athletic', 'admin'] },
        { label: 'Pacotes', icon: 'Package', href: '/dashboard/packages', roles: ['athletic', 'admin'] }
      ]
    },
    {
      category: 'Financeiro',
      items: [
        // { label: 'Pagamentos', icon: 'CreditCard', href: '/dashboard/payments', roles: ['admin'] },
        // { label: 'Aprovar PIX', icon: 'QrCode', href: '/dashboard/approve-pix', roles: ['admin'] },
        // { label: 'Configurar PIX', icon: 'QrCode', href: '/dashboard/pix-settings', roles: ['athletic'] }
      ]
    },
    {
      category: 'Configurações',
      items: [{ label: 'Configurações', icon: 'Settings', href: '/dashboard/settings', roles: ['athletic', 'admin'] }]
    }
  ]

  const handleLinkClick = () => {
    // Close mobile menu when a link is clicked
    setIsMobileMenuOpen(false)
  }

  const SidebarContent = () => (
    <div className='flex flex-col h-full bg-white'>
      {/* Header - only show on mobile */}
      <div className='md:hidden p-4 border-b flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-[#0456FC]'>JISC</h2>
          <p className='text-sm text-gray-500'>Campeonato Universitário</p>
        </div>
        <Button variant='ghost' size='icon' onClick={() => setIsMobileMenuOpen(false)} className='h-8 w-8'>
          <Icons.X className='h-4 w-4' />
        </Button>
      </div>

      {/* Header - desktop only */}
      <div className='hidden md:block p-4 text-center border-b'>
        <h2 className='text-2xl font-bold text-[#0456FC]'>JISC</h2>
        <p className='text-sm text-gray-500'>Campeonato Universitário</p>
      </div>

      <nav className='flex-1 overflow-y-auto p-4 space-y-6'>
        {navItems.map((category) => {
          const filteredItems = category.items.filter((item) => userRole && item.roles.includes(userRole))
          if (filteredItems.length === 0) return null

          return (
            <div key={category.category} className='nav-category'>
              <h3 className='text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2'>{category.category}</h3>
              <div className='space-y-1'>
                {filteredItems.map((item) => {
                  const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`nav-item flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                        pathname === item.href ? 'bg-[#0456FC] text-white shadow-lg' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className='h-5 w-5 mr-3 flex-shrink-0' />
                      <span className='truncate'>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className='p-4 border-t'>
        <Button
          variant='outline'
          className='w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700'
          onClick={signOut}
        >
          <Icons.LogOut className='mr-2 h-5 w-5 flex-shrink-0' />
          <span className='truncate'>Sair</span>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-50 md:hidden'>
          {/* Backdrop */}
          <div className='absolute inset-0 bg-black/50' onClick={() => setIsMobileMenuOpen(false)} />

          {/* Sidebar */}
          <div className='relative z-10 h-full w-80 max-w-[85vw] bg-white shadow-xl'>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className='hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 md:h-screen md:sticky md:top-0 md:shadow-lg'>
        <SidebarContent />
      </aside>
    </>
  )
}
