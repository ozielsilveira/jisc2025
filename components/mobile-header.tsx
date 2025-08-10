'use client'

import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface MobileHeaderProps {
  onMenuToggle: () => void
}

export default function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <header className='md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Button variant='ghost' size='icon' onClick={onMenuToggle} className='h-8 w-8'>
            <Menu className='h-5 w-5' />
          </Button>
          <h1 className='text-xl font-bold text-[#0456FC]'>JISC</h1>
        </div>
      </div>
    </header>
  )
}
