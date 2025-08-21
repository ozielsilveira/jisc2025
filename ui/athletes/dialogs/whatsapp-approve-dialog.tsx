'use client'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, MessageCircle, CreditCard, Send } from 'lucide-react'
import type { Athlete } from '@/domain/athletes/entities'
import { useState, useEffect, useRef } from 'react'

type Props = {
  athlete: Athlete | null
  isOpen: boolean
  isLoading: boolean
  preview: (custom?: string) => string
  onConfirm: (custom?: string) => void
  onClose: () => void
}

export function WhatsAppApproveDialog({ athlete, isOpen, isLoading, preview, onConfirm, onClose }: Props) {
  const [msg, setMsg] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setMsg('')
    } else {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!athlete) return null
  const text = preview(msg)
  const isNearLimit = msg.length > 400
  const characterCountColor = isNearLimit ? 'text-amber-700' : 'text-gray-700'
  const pkg = athlete.athlete_packages?.[0]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[95vw] max-w-2xl lg:max-w-3xl p-0 rounded-2xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col'>
        <div className='bg-gradient-to-br from-green-500 to-emerald-600 px-4 sm:px-6 py-6 sm:py-8 text-center text-white flex-shrink-0'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4'>
            <CheckCircle className='h-8 w-8 sm:h-10 sm:w-10 text-white' />
          </div>
          <DialogTitle className='text-xl sm:text-2xl font-bold'>Aprovar Cadastro</DialogTitle>
          <p className='text-green-100 text-xs sm:text-sm font-medium mt-1'>O atleta será notificado via WhatsApp</p>
        </div>

        <div className='flex-1 overflow-y-auto'>
          <div className='px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6'>
            {pkg && (
              <div className='bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border text-center'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2'>
                  <CreditCard className='h-6 w-6 sm:h-8 sm:w-8 text-white' />
                </div>
                <p className='text-sm font-semibold text-blue-700 mb-1'>Pacote Selecionado</p>
                <h4 className='text-base sm:text-lg font-bold text-gray-900'>{pkg.package.name}</h4>
              </div>
            )}

            <div className='bg-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border'>
              <div className='flex items-center gap-2 mb-3'>
                <MessageCircle className='h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0' />
                <p className='font-semibold text-green-800 text-sm sm:text-base'>Prévia da Mensagem WhatsApp</p>
              </div>
              <div className='bg-white rounded-lg sm:rounded-xl p-3 border h-20 sm:h-24 overflow-auto text-sm leading-relaxed'>
                <div className='whitespace-pre-line break-words text-gray-900' aria-live='polite'>
                  {text || 'A mensagem aparecerá aqui...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 flex-shrink-0 bg-white border-t border-gray-100'>
          <Button
            onClick={() => onConfirm(msg)}
            disabled={isLoading}
            variant='outline'
            className='w-full h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm sm:text-base font-medium'
            aria-describedby='confirm-action-desc'
          >
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin' />
                <span>Aprovando...</span>
              </>
            ) : (
              <>
                <Send className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
                <span>Aprovar e Enviar WhatsApp</span>
              </>
            )}
          </Button>
          <span id='confirm-action-desc' className='sr-only'>
            Esta ação aprovará o cadastro do atleta e enviará uma notificação via WhatsApp
          </span>

          <Button
            variant='outline'
            onClick={onClose}
            disabled={isLoading}
            className='w-full h-10 sm:h-11 text-sm sm:text-base border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent'
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
