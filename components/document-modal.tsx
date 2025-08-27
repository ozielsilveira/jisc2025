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

  const isImage = documentUrl && /\.(jpg|jpeg|png|gif)$/i.test(documentUrl)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'p-0 flex flex-col',
          isMobile ? 'max-w-[95vw] w-[95vw] h-[80vh]' : 'max-w-6xl w-full h-[90vh]'
        )}
      >
        <DialogHeader className='p-6 pb-4'>
          <DialogTitle className='text-xl font-semibold text-gray-900'>{title}</DialogTitle>
        </DialogHeader>

        <div className='flex-1 min-h-0 px-6 pb-6'>
          {documentUrl ? (
            <div className='w-full h-full rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden'>
              {isImage ? (
                isMobile ? (
                  <div className='w-full h-full overflow-auto' style={{ WebkitOverflowScrolling: 'touch' }}>
                    <img
                      src={documentUrl}
                      alt='Documento'
                      style={{
                        maxWidth: 'none',
                        touchAction: 'pinch-zoom pan-y pan-x'
                      }}
                    />
                  </div>
                ) : (
                  <img src={documentUrl} alt='Documento' className='object-contain max-w-full max-h-full' />
                )
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
