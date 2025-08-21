// src/components/dashboard-sidebar.tsx
'use client'

import type React from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Icons from 'lucide-react'
import { useEffect } from 'react'
import { useUserRole } from '@/hooks/use-user-role'

type DashboardSidebarProps = {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const NAV_ITEMS = [
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
      { label: 'Relatório', icon: 'FileText', href: '/dashboard/report', roles: ['admin'] },
    ]
  },
  {
    category: 'Competição',
    items: [{ label: 'Pacotes', icon: 'Package', href: '/dashboard/packages', roles: ['athletic', 'admin'] }]
  },
  {
    category: 'Configurações',
    items: [{ label: 'Configurações', icon: 'Settings', href: '/dashboard/settings', roles: ['admin'] }]
  }
]

export default function DashboardSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: DashboardSidebarProps) {
  const { user, signOut } = useAuth()
  const { role: userRole } = useUserRole(user?.id ?? null)
  const pathname = usePathname()

  const handleLinkClick = () => setIsMobileMenuOpen(false)
  const handleKeyDown = (event: React.KeyboardEvent, href: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleLinkClick()
      window.location.href = href
    }
  }

  // Permitir fechar o menu móvel com ESC
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen, setIsMobileMenuOpen])

  const SidebarContent = () => (
    <div className='flex flex-col h-full bg-white dark:bg-gray-800'>
      {/* Cabeçalho - Mobile */}
      <div className='md:hidden p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-[#0456FC]'>JISC</h2>
          <p className='text-sm text-gray-500 dark:text-gray-400'>Campeonato Universitário</p>
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setIsMobileMenuOpen(false)}
          className='h-8 w-8 focus-ring'
          aria-label='Fechar menu de navegação'
        >
          <Icons.X className='h-4 w-4' />
        </Button>
      </div>

      {/* Cabeçalho - Desktop */}
      <div className='hidden md:block p-4 text-center border-b border-gray-200 dark:border-gray-700'>
        <h2 className='text-2xl font-bold text-[#0456FC]'>JISC</h2>
        <p className='text-sm text-gray-500 dark:text-gray-400'>Campeonato Universitário</p>
      </div>

      <nav className='flex-1 overflow-y-auto p-4 space-y-6' role='navigation' aria-label='Menu principal'>
        {NAV_ITEMS.map((category) => {
          const filteredItems = category.items.filter((item) => userRole && item.roles.includes(userRole))
          if (filteredItems.length === 0) return null

          return (
            <div key={category.category} className='nav-category'>
              <h3 className='text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3'>
                {category.category}
              </h3>
              <div className='space-y-1' role='group' aria-labelledby={`category-${category.category}`}>
                {filteredItems.map((item) => {
                  const Icon = Icons[item.icon as keyof typeof Icons] as React.ElementType
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      onKeyDown={(e) => handleKeyDown(e, item.href)}
                      className={`nav-item flex items-center rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus-ring group ${
                        isActive
                          ? 'bg-[#0456FC] text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                      role='menuitem'
                    >
                      <Icon
                        className='h-5 w-5 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-200'
                        aria-hidden='true'
                      />
                      <span className='truncate font-medium'>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
        <Button
          variant='outline'
          className='w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 focus-ring bg-transparent'
          onClick={signOut}
          aria-label='Sair da conta'
        >
          <Icons.LogOut className='mr-2 h-5 w-5 flex-shrink-0' aria-hidden='true' />
          <span className='truncate'>Sair</span>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Sidebar móvel (overlay) */}
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 z-50 md:hidden'
          role='dialog'
          aria-modal='true'
          aria-labelledby='mobile-menu-title'
        >
          {/* overlay/backdrop */}
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchStart={() => setIsMobileMenuOpen(false)}
            aria-hidden='true'
          />
          {/* Conteúdo do menu móvel */}
          <div
            id='mobile-sidebar'
            className='relative z-10 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl safe-left'
            role='menu'
            aria-labelledby='mobile-menu-title'
          >
            <div id='mobile-menu-title' className='sr-only'>
              Menu de navegação principal
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Sidebar fixa no desktop */}
      <aside className='hidden md:block md:fixed md:inset-y-0 md:left-0 md:w-64 md:z-40 md:shadow-lg'>
        <SidebarContent />
      </aside>
    </>
  )
}
