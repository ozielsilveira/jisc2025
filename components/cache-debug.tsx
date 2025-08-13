'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cacheDebug } from '@/lib/services'
import { BarChart3, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export const CacheDebug = () => {
  const [stats, setStats] = useState(cacheDebug.getStats())
  const [isVisible, setIsVisible] = useState(false)

  const updateStats = () => {
    setStats(cacheDebug.getStats())
  }

  const clearCache = () => {
    cacheDebug.clearAll()
    updateStats()
  }

  useEffect(() => {
    // Só mostrar em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <Card className='w-80 shadow-lg border-2 border-blue-200'>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm flex items-center gap-2'>
              <BarChart3 className='h-4 w-4 text-blue-600' />
              Cache Debug
            </CardTitle>
            <div className='flex gap-1'>
              <Button size='sm' variant='outline' onClick={updateStats} className='h-6 px-2'>
                <RefreshCw className='h-3 w-3' />
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={clearCache}
                className='h-6 px-2 text-red-600 hover:text-red-700'
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-xs text-gray-600'>Itens no cache:</span>
              <Badge variant='outline' className='text-xs'>
                {stats.size} / {stats.maxSize}
              </Badge>
            </div>

            <div className='space-y-1'>
              <span className='text-xs text-gray-600'>Chaves ativas:</span>
              <div className='max-h-20 overflow-y-auto'>
                {stats.keys.slice(0, 5).map((key) => (
                  <div key={key} className='text-xs text-gray-500 truncate'>
                    {key}
                  </div>
                ))}
                {stats.keys.length > 5 && (
                  <div className='text-xs text-gray-400'>... e mais {stats.keys.length - 5} chaves</div>
                )}
              </div>
            </div>

            <div className='pt-2 border-t border-gray-200'>
              <div className='flex justify-between items-center'>
                <span className='text-xs text-gray-600'>Uso:</span>
                <div className='w-16 bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${(stats.size / stats.maxSize) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
