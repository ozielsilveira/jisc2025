'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string | null
  title?: string
}

export function DocumentModal({ isOpen, onClose, documentUrl, title = 'Visualizar Documento' }: DocumentModalProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn('max-h-[90vh] p-0', isMobile ? 'max-w-[95vw] w-[95vw]' : 'max-w-4xl')}>
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-xl font-semibold text-gray-900'>{title}</DialogTitle>
        </DialogHeader>

        <div className='flex-1 min-h-0 px-6 pb-6'>
          {documentUrl ? (
            <div
              className={cn(
                'w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50',
                isMobile ? 'h-[70vh]' : 'h-[70vh]'
              )}
            >
              {isMobile ? (
                <div
                  className='w-full h-full overflow-auto'
                  style={{
                    touchAction: 'pinch-zoom',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <img
                    src={documentUrl || '/placeholder.svg'}
                    alt='Documento'
                    className='w-full h-full object-contain'
                    style={{
                      maxWidth: 'none',
                      touchAction: 'pinch-zoom'
                    }}
                  />
                </div>
              ) : (
                <iframe src={documentUrl} className='w-full h-full' title='Documento' />
              )}
            </div>
          ) : (
            <div className='flex items-center justify-center h-96 bg-gray-50 rounded-lg'>
              <div className='text-center'>
                <FileText className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Documento não encontrado.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
