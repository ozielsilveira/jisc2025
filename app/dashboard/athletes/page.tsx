'use client'

import { useAuth } from '@/components/auth-provider'
import { DocumentModal } from '@/components/document-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useAthletesList,
  useAthleticByRepresentative,
  useAthletics,
  usePackages,
  useSports,
  useUserData
} from '@/hooks/use-cached-data'
import { useToast } from '@/hooks/use-toast'
import { athleteService } from '@/lib/services'
import { supabase } from '@/lib/supabase'
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Eye,
  FileCheck,
  Info,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  UserX,
  X,
  XCircle
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

// Types
type Athlete = {
  id: string
  user_id: string
  athletic_id: string
  enrollment_document_url: string
  status: 'pending' | 'sent' | 'approved' | 'rejected'
  created_at: string
  cnh_cpf_document_url: string
  wpp_sent: boolean
  user: {
    name: string
    email: string
    cpf: string
    phone: string
    gender: string
  }
  athletic: {
    name: string
  }
  sports: Array<{
    id: string
    name: string
    type: 'sport' | 'boteco'
  }>
  athlete_packages?: Array<{
    id: string
    package: {
      id: string
      name: string
      price: number
      description: string
    }
    payment_status: string
  }>
}

type Athletic = {
  id: string
  name: string
  university: string
}

type Sport = {
  id: string
  name: string
  type: 'sport' | 'boteco'
}

type Package = {
  id: string
  name: string
  price: number
  description: string
}

type SortField = 'name' | 'created_at' | 'status' | 'athletic'
type SortOrder = 'asc' | 'desc'

// Utility function to format WhatsApp message
const formatWhatsAppMessage = (athleteName: string, packageName: string, packagePrice: number): string => {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(packagePrice)
  return `Olá ${athleteName}, você adquiriu o pacote ${packageName} no valor ${formattedPrice}, abaixo temos nossos métodos de pagamentos:`
}

// Utility function to format WhatsApp rejection message
const formatWhatsAppRejectionMessage = (athleteName: string, customMessage?: string): string => {
  const baseMessage = `Olá ${athleteName}! 

Seu cadastro de atleta foi rejeitado e precisa ser ajustado.`

  const customPart = customMessage
    ? `

Motivo da rejeição:
${customMessage}`
    : ''

  const linkPart = `

Por favor, acesse o link abaixo para corrigir as informações e reenviar sua documentação:
${window.location.origin}/dashboard/profile

Qualquer dúvida, entre em contato conosco!`

  return baseMessage + customPart + linkPart
}

// Utility function to create WhatsApp URL
const createWhatsAppUrl = (phoneNumber: string, message: string): string => {
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

// Enhanced logging utility
const logAthleteSearch = (action: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    action,
    data,
    error: error?.message || error
  }
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 [Athlete Search] ${action}`)
    console.log('Timestamp:', timestamp)
    if (data) console.log('Data:', data)
    if (error) console.error('Error:', error)
    console.groupEnd()
  }
}

// Hook otimizado com cache
const useAthletesOptimized = (user: any, userRole: string | null) => {
  const searchParams = useSearchParams()
  const [athleticId, setAthleticId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Usar hooks com cache
  const { athletics } = useAthletics()
  const { sports } = useSports()
  const { packages } = usePackages()
  const { athletic: userAthletic } = useAthleticByRepresentative(user?.id)

  // Determinar athleticId para representantes
  useEffect(() => {
    if (userRole === 'athletic' && userAthletic) {
      setAthleticId(userAthletic.id)
    }
  }, [userRole, userAthletic])

  // Construir filtros para a lista de atletas
  const filters = useMemo(() => {
    const baseFilters: any = {}

    if (userRole === 'admin') {
      const athleticFilter = searchParams.get('athletic')
      if (athleticFilter && athleticFilter !== 'all') {
        baseFilters.athleticId = athleticFilter
      }
    } else if (userRole === 'athletic' && athleticId) {
      baseFilters.athleticId = athleticId
    }

    return baseFilters
  }, [userRole, searchParams, athleticId])

  const { athletes, loading: isLoading, error, refetch } = useAthletesList(filters)

  // Tratar erros
  useEffect(() => {
    if (error) {
      setFetchError(error)
    } else {
      setFetchError(null)
    }
  }, [error])

  return {
    athletes,
    athletics,
    sports,
    packages,
    isLoading,
    athleticId,
    fetchError,
    refetch
  }
}

// Enhanced Components
const StatusBadge = ({ status }: { status: Athlete['status'] }) => {
  const statusConfig = {
    approved: {
      label: 'Aprovado',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle
    },
    rejected: {
      label: 'Rejeitado',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle
    },
    pending: {
      label: 'Pendente',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertCircle
    },
    sent: {
      label: 'Em Análise',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Loader2
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant='outline' className={`${config.className} font-medium px-3 py-1 text-sm`}>
      <Icon className='h-3 w-3 mr-1.5' />
      {config.label}
    </Badge>
  )
}

const WhatsAppStatusBadge = ({ sent }: { sent: boolean }) => {
  return (
    <Badge
      variant='outline'
      className={`text-sm font-medium px-3 py-1 ${
        sent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'
      }`}
    >
      {sent ? (
        <>
          <CheckCircle className='h-3 w-3 mr-1.5' />
          WhatsApp Enviado
        </>
      ) : (
        <>
          <MessageCircle className='h-3 w-3 mr-1.5' />
          WhatsApp Pendente
        </>
      )}
    </Badge>
  )
}

const SportsBadges = ({ sports }: { sports: Athlete['sports'] }) => {
  if (!sports.length) return null

  return (
    <div className='flex flex-wrap gap-1.5'>
      {sports.slice(0, 4).map((sport) => (
        <Badge
          key={sport.id}
          variant='secondary'
          className={`text-xs font-medium px-2.5 py-1 ${
            sport.type === 'sport'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}
        >
          {sport.name}
        </Badge>
      ))}
      {sports.length > 4 && (
        <Badge variant='secondary' className='text-xs bg-slate-50 text-slate-600 px-2.5 py-1 font-medium'>
          +{sports.length - 4} mais
        </Badge>
      )}
    </div>
  )
}

// WhatsApp Confirmation Dialog - Responsividade Melhorada
const WhatsAppConfirmationDialog = ({
  athlete,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}: {
  athlete: Athlete | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}) => {
  if (!athlete || !athlete.athlete_packages?.length) return null

  const athletePackage = athlete.athlete_packages[0]
  const message = formatWhatsAppMessage(athlete.user.name, athletePackage.package.name, athletePackage.package.price)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[96vw] max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl h-[96vh] max-h-[96vh] rounded-3xl border-0 shadow-2xl bg-white p-0 overflow-hidden flex flex-col'>
        {/* Header Mobile-First */}
        <div className='bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white flex-shrink-0'>
          <div className='w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
            <CheckCircle className='h-10 w-10 text-white' />
          </div>
          <DialogTitle className='text-2xl font-bold mb-2'>Aprovar Cadastro</DialogTitle>
          <p className='text-green-100 text-sm font-medium'>Confirme o envio da mensagem WhatsApp</p>
        </div>

        {/* Content Area with Better Mobile Spacing */}
        <div className='flex-1 overflow-y-auto px-4 py-6 space-y-6'>
          {/* Athlete Info - Mobile Optimized */}
          <div className='bg-slate-50 rounded-2xl p-5 border border-slate-200'>
            <div className='text-center space-y-3'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg'>
                <Building2 className='h-8 w-8 text-white' />
              </div>
              <div>
                <h3 className='text-xl font-bold text-gray-900 mb-1'>{athlete.user.name}</h3>
                <div className='flex items-center justify-center space-x-2 text-gray-600'>
                  <Phone className='h-4 w-4' />
                  <span className='text-sm font-medium'>{athlete.user.phone}</span>
                </div>
                <span className='inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full'>
                  {athlete.athletic.name}
                </span>
              </div>
            </div>
          </div>

          {/* Package Info - Mobile Optimized */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200'>
            <div className='text-center space-y-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg'>
                <CreditCard className='h-8 w-8 text-white' />
              </div>
              <div>
                <p className='text-sm font-semibold text-blue-700 mb-1'>Pacote Selecionado</p>
                <h4 className='text-lg font-bold text-blue-900 mb-3'>{athletePackage.package.name}</h4>
                <div className='bg-white rounded-xl px-4 py-3 shadow-sm border border-blue-200 inline-block'>
                  <p className='text-2xl font-bold text-blue-700'>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(athletePackage.package.price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Preview - Completely Redesigned for Mobile */}
          <div className='bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-300 shadow-lg'>
            <div className='text-center mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg'>
                <MessageCircle className='h-8 w-8 text-white' />
              </div>
              <h4 className='text-lg font-bold text-green-800 mb-1'>📱 Mensagem WhatsApp</h4>
              <p className='text-sm text-green-700'>Será enviada automaticamente após confirmação</p>
            </div>

            {/* WhatsApp Message Simulation - Mobile Optimized */}
            <div className='bg-white rounded-2xl p-4 shadow-inner border-2 border-green-200 relative'>
              <div className='absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-2xl'></div>

              {/* WhatsApp Header */}
              <div className='flex items-center space-x-3 pt-3 pb-4 border-b border-green-100'>
                <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md'>
                  <span className='text-white text-sm font-bold'>W</span>
                </div>
                <div>
                  <p className='font-semibold text-gray-800'>WhatsApp Business</p>
                  <p className='text-xs text-gray-500'>Online agora</p>
                </div>
              </div>

              {/* Message Bubble */}
              <div className='py-4'>
                <div className='bg-green-100 rounded-2xl rounded-tl-md p-4 border border-green-200 shadow-sm'>
                  <p className='text-gray-800 leading-relaxed font-medium break-words'>{message}</p>
                </div>
                <div className='flex justify-end mt-2'>
                  <span className='text-xs text-gray-400 flex items-center space-x-1'>
                    <span>Agora</span>
                    <span className='text-green-500'>✓✓</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice - Mobile Optimized */}
          <div className='bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200'>
            <div className='text-center space-y-3'>
              <div className='w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto'>
                <Info className='h-6 w-6 text-white' />
              </div>
              <div>
                <p className='font-bold text-amber-800 mb-2'>⚠️ Importante</p>
                <p className='text-sm text-amber-700 leading-relaxed'>
                  Ap&oacute;s confirmar, o status ser&aacute; alterado para &quot;WhatsApp Enviado&quot; e voc&ecirc;
                  ser&aacute; redirecionado automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Large Touch-Friendly Buttons */}
        <div className='px-6 py-6 bg-gray-50 border-t border-gray-200 flex-shrink-0'>
          <div className='space-y-3'>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className='w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] rounded-xl'
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-6 w-6 mr-3 animate-spin' />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className='h-6 w-6 mr-3' />
                  Confirmar e Enviar WhatsApp
                </>
              )}
            </Button>
            <Button
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
              className='w-full h-12 font-semibold border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 rounded-xl text-base bg-transparent'
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// WhatsApp Rejection Dialog - Responsividade Melhorada
const WhatsAppRejectionDialog = ({
  athlete,
  isOpen,
  onClose,
  onConfirm,
  isLoading
}: {
  athlete: Athlete | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (customMessage?: string) => void
  isLoading: boolean
}) => {
  const [customMessage, setCustomMessage] = useState('')

  if (!athlete) return null

  const message = formatWhatsAppRejectionMessage(athlete.user.name, customMessage)

  const handleConfirm = () => {
    onConfirm(customMessage)
    setCustomMessage('')
  }

  const handleClose = () => {
    onClose()
    setCustomMessage('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[96vw] max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl h-[96vh] max-h-[96vh] rounded-3xl border-0 shadow-2xl bg-white p-0 overflow-hidden flex flex-col'>
        {/* Header Mobile-First */}
        <div className='bg-gradient-to-br from-red-500 to-rose-600 px-6 py-8 text-center text-white flex-shrink-0'>
          <div className='w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
            <XCircle className='h-10 w-10 text-white' />
          </div>
          <DialogTitle className='text-2xl font-bold mb-2'>Rejeitar Cadastro</DialogTitle>
          <p className='text-red-100 text-sm font-medium'>O atleta será notificado via WhatsApp</p>
        </div>

        {/* Content Area with Better Mobile Spacing */}
        <div className='flex-1 overflow-y-auto px-4 py-6 space-y-6'>
          {/* Athlete Info - Mobile Optimized */}
          <div className='bg-slate-50 rounded-2xl p-5 border border-slate-200'>
            <div className='text-center space-y-3'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto shadow-lg'>
                <Building2 className='h-8 w-8 text-white' />
              </div>
              <div>
                <h3 className='text-xl font-bold text-gray-900 mb-1'>{athlete.user.name}</h3>
                <div className='flex items-center justify-center space-x-2 text-gray-600'>
                  <Phone className='h-4 w-4' />
                  <span className='text-sm font-medium'>{athlete.user.phone}</span>
                </div>
                <span className='inline-block mt-2 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full'>
                  {athlete.athletic.name}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Reason - Mobile Optimized */}
          <div className='bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200'>
            <div className='text-center mb-4'>
              <div className='w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3'>
                <AlertCircle className='h-6 w-6 text-white' />
              </div>
              <h4 className='font-bold text-amber-800 mb-1'>Motivo da Rejeição</h4>
              <p className='text-sm text-amber-700'>Opcional - Explique o motivo para o atleta</p>
            </div>
            <Textarea
              placeholder='Ex: Documento ilegível, informações incompletas, dados inconsistentes...'
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className='min-h-[120px] border-amber-200 focus:border-amber-400 focus:ring-amber-400 rounded-xl resize-none text-base'
              maxLength={500}
            />
            <div className='text-right mt-2'>
              <span className='text-xs text-amber-600 font-medium'>{customMessage.length}/500 caracteres</span>
            </div>
          </div>

          {/* WhatsApp Preview - Completely Redesigned for Mobile */}
          <div className='bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border-2 border-red-300 shadow-lg'>
            <div className='text-center mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg'>
                <MessageCircle className='h-8 w-8 text-white' />
              </div>
              <h4 className='text-lg font-bold text-red-800 mb-1'>📱 Mensagem WhatsApp</h4>
              <p className='text-sm text-red-700'>Será enviada automaticamente após confirmação</p>
            </div>

            {/* WhatsApp Message Simulation - Mobile Optimized */}
            <div className='bg-white rounded-2xl p-4 shadow-inner border-2 border-red-200 relative'>
              <div className='absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-rose-500 rounded-t-2xl'></div>

              {/* WhatsApp Header */}
              <div className='flex items-center space-x-3 pt-3 pb-4 border-b border-red-100'>
                <div className='w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-md'>
                  <span className='text-white text-sm font-bold'>W</span>
                </div>
                <div>
                  <p className='font-semibold text-gray-800'>WhatsApp Business</p>
                  <p className='text-xs text-gray-500'>Online agora</p>
                </div>
              </div>

              {/* Message Bubble */}
              <div className='py-4'>
                <div className='bg-red-100 rounded-2xl rounded-tl-md p-4 border border-red-200 shadow-sm max-h-32 overflow-y-auto'>
                  <p className='text-gray-800 leading-relaxed font-medium break-words whitespace-pre-line'>{message}</p>
                </div>
                <div className='flex justify-end mt-2'>
                  <span className='text-xs text-gray-400 flex items-center space-x-1'>
                    <span>Agora</span>
                    <span className='text-red-500'>✓✓</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Correction Link Info - Mobile Optimized */}
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200'>
            <div className='text-center space-y-3'>
              <div className='w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto'>
                <ExternalLink className='h-6 w-6 text-white' />
              </div>
              <div>
                <p className='font-bold text-blue-800 mb-2'>🔗 Link de Correção</p>
                <p className='text-sm text-blue-700 mb-3 leading-relaxed'>
                  O atleta receberá um link para corrigir as informações
                </p>
                <div className='bg-blue-100 rounded-xl p-3 border border-blue-200'>
                  <p className='text-xs text-blue-800 font-mono break-all'>
                    {typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/profile
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Process Info - Mobile Optimized */}
          <div className='bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200'>
            <div className='text-center space-y-4'>
              <div className='w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center mx-auto'>
                <Info className='h-6 w-6 text-white' />
              </div>
              <div>
                <p className='font-bold text-gray-800 mb-3'>ℹ️ O que acontecerá:</p>
                <div className='space-y-3 text-left'>
                  <div className='flex items-start space-x-3'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0'></div>
                    <span className='text-sm text-gray-700'>Status alterado para &quot;Rejeitado&quot;</span>
                  </div>
                  <div className='flex items-start space-x-3'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0'></div>
                    <span className='text-sm text-gray-700'>Mensagem enviada via WhatsApp</span>
                  </div>
                  <div className='flex items-start space-x-3'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0'></div>
                    <span className='text-sm text-gray-700'>Atleta pode corrigir e reenviar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Large Touch-Friendly Buttons */}
        <div className='px-6 py-6 bg-gray-50 border-t border-gray-200 flex-shrink-0'>
          <div className='space-y-3'>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className='w-full h-14 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] rounded-xl'
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-6 w-6 mr-3 animate-spin' />
                  Rejeitando...
                </>
              ) : (
                <>
                  <UserX className='h-6 w-6 mr-3' />
                  Rejeitar e Enviar WhatsApp
                </>
              )}
            </Button>
            <Button
              variant='outline'
              onClick={handleClose}
              disabled={isLoading}
              className='w-full h-12 font-semibold border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 rounded-xl text-base bg-transparent'
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface AthleteCardProps {
  athlete: Athlete
  userRole: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onWhatsApp: (athlete: Athlete) => void
  onViewDocument: (url: string) => void
}

const AthleteListItem = ({
  athlete,
  userRole,
  onViewDocument,
  onApprove,
  onReject,
  onWhatsApp
}: {
  athlete: Athlete
  userRole: string | null
  onViewDocument: (url: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onWhatsApp: (athlete: Athlete) => void
}) => {
  const hasPackage = athlete.athlete_packages && athlete.athlete_packages.length > 0

  return (
    <Card className='hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white'>
      <CardContent className='p-6'>
        <div className='space-y-6'>
          {/* Header - Nome e Status */}
          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1 min-w-0'>
              <h3 className='font-bold text-gray-900 text-2xl mb-2 leading-tight'>{athlete.user.name}</h3>
              <p className='text-gray-600 font-medium'>{athlete.athletic.name}</p>
            </div>
            <div className='flex flex-col items-end gap-2 flex-shrink-0'>
              <StatusBadge status={athlete.status} />
              {userRole === 'athletic' && athlete.status === 'approved' && (
                <WhatsAppStatusBadge sent={athlete.wpp_sent} />
              )}
            </div>
          </div>

          {/* Informações de Contato */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='flex items-center space-x-3 text-gray-600'>
              <Mail className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium truncate'>{athlete.user.email}</span>
            </div>
            <div className='flex items-center space-x-3 text-gray-600'>
              <Phone className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium'>{athlete.user.phone}</span>
            </div>
            <div className='flex items-center space-x-3 text-gray-600'>
              <Calendar className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium'>{new Date(athlete.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className='flex items-center space-x-3 text-gray-600'>
              <Trophy className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium'>{athlete.sports.length} modalidades</span>
            </div>
          </div>

          {/* Pacote */}
          {hasPackage && (
            <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
              <div className='flex justify-between items-center'>
                <div>
                  <p className='text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1'>PACOTE</p>
                  <p className='font-bold text-blue-900 text-lg'>{athlete.athlete_packages![0].package.name}</p>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold text-blue-700'>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(athlete.athlete_packages![0].package.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modalidades */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>MODALIDADES</p>
              <span className='text-xs text-gray-400 font-medium'>{athlete.sports.length} total</span>
            </div>
            <SportsBadges sports={athlete.sports} />
          </div>

          {/* Botões de Ação */}
          <div className='flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100'>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onViewDocument(athlete.cnh_cpf_document_url)}
                disabled={!athlete.cnh_cpf_document_url}
                className='h-10 px-4 font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              >
                <Eye className='h-4 w-4 mr-2' />
                Documento
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onViewDocument(athlete.enrollment_document_url)}
                disabled={!athlete.enrollment_document_url}
                className='h-10 px-4 font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              >
                <FileCheck className='h-4 w-4 mr-2' />
                Matrícula
              </Button>
              {athlete.status === 'approved' && hasPackage && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onWhatsApp(athlete)}
                  className={`h-10 px-4 font-medium border transition-colors ${
                    athlete.wpp_sent
                      ? 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'
                      : 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  <MessageCircle className='h-4 w-4 mr-2' />
                  {athlete.wpp_sent ? 'Reenviar mensagem' : 'Enviar mensagem'}
                </Button>
              )}
            </div>

            {(userRole === 'admin' || userRole === 'athletic') && athlete.status === 'sent' && (
              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onReject(athlete.id)}
                  className='h-10 px-4 font-medium border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors'
                >
                  <UserX className='h-4 w-4 mr-2' />
                  Rejeitar
                </Button>
                <Button
                  size='sm'
                  onClick={() => onApprove(athlete.id)}
                  className='h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors'
                >
                  <UserCheck className='h-4 w-4 mr-2' />
                  Aprovar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const EmptyState = ({ userRole }: { userRole: string | null }) => (
  <div className='text-center py-20'>
    <div className='inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6'>
      <Users className='h-10 w-10 text-gray-400' />
    </div>
    <h3 className='text-xl font-semibold text-gray-900 mb-2'>
      {userRole === 'athletic' ? 'Nenhum atleta cadastrado' : 'Nenhum atleta encontrado'}
    </h3>
    <p className='text-gray-600 max-w-md mx-auto'>
      {userRole === 'athletic'
        ? 'Compartilhe o link de cadastro para começar a montar sua equipe!'
        : 'Tente ajustar os filtros para encontrar os atletas que procura.'}
    </p>
  </div>
)

const LoadingState = () => (
  <div className='flex items-center justify-center py-20'>
    <div className='flex flex-col items-center space-y-4'>
      <div className='w-8 h-8 border-2 border-blue-200 rounded-full animate-spin border-t-blue-600'></div>
      <p className='text-gray-600 font-medium'>Carregando atletas...</p>
    </div>
  </div>
)

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className='text-center py-20'>
    <div className='inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6'>
      <AlertCircle className='h-10 w-10 text-red-500' />
    </div>
    <h3 className='text-xl font-semibold text-gray-900 mb-2'>Erro ao carregar dados</h3>
    <p className='text-gray-600 max-w-md mx-auto mb-6'>{error}</p>
    <Button onClick={onRetry} className='bg-blue-600 hover:bg-blue-700'>
      <RefreshCw className='h-4 w-4 mr-2' />
      Tentar Novamente
    </Button>
  </div>
)

// Statistics Cards Component
const StatisticsCards = ({ athletes }: { athletes: Athlete[] }) => {
  const stats = useMemo(() => {
    const total = athletes.length
    const approved = athletes.filter((a) => a.status === 'approved').length
    const pending = athletes.filter((a) => a.status === 'sent').length
    const whatsappSent = athletes.filter((a) => a.wpp_sent).length

    return { total, approved, pending, whatsappSent }
  }, [athletes])

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
      <Card className='bg-blue-50 border-blue-200'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-blue-600 text-sm font-medium'>Total</p>
              <p className='text-2xl font-bold text-blue-900'>{stats.total}</p>
            </div>
            <Users className='h-8 w-8 text-blue-500' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-emerald-50 border-emerald-200'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-emerald-600 text-sm font-medium'>Aprovados</p>
              <p className='text-2xl font-bold text-emerald-900'>{stats.approved}</p>
            </div>
            <CheckCircle className='h-8 w-8 text-emerald-500' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-amber-50 border-amber-200'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-amber-600 text-sm font-medium'>Pendentes</p>
              <p className='text-2xl font-bold text-amber-900'>{stats.pending}</p>
            </div>
            <AlertCircle className='h-8 w-8 text-amber-500' />
          </div>
        </CardContent>
      </Card>

      <Card className='bg-green-50 border-green-200'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-green-600 text-sm font-medium'>WhatsApp</p>
              <p className='text-2xl font-bold text-green-900'>{stats.whatsappSent}</p>
            </div>
            <MessageCircle className='h-8 w-8 text-green-500' />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Component
export default function AthletesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { role: userRole } = useUserData()
  const [isUserAthlete, setIsUserAthlete] = useState(false)

  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAthleticFilter, setSelectedAthleticFilter] = useState('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [selectedSportFilter, setSelectedSportFilter] = useState('all')
  const [selectedWhatsAppFilter, setSelectedWhatsAppFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Document Dialog
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState('')

  // WhatsApp Dialog
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false)

  // WhatsApp Rejection Dialog
  const [whatsappRejectionDialogOpen, setWhatsappRejectionDialogOpen] = useState(false)
  const [selectedAthleteForRejection, setSelectedAthleteForRejection] = useState<Athlete | null>(null)
  const [isRejectionLoading, setIsRejectionLoading] = useState(false)

  const { athletes, athletics, sports, packages, isLoading, athleticId, fetchError, refetch } = useAthletesOptimized(
    user,
    userRole
  )

  // Verificar se o usuário é atleta
  useEffect(() => {
    const checkUserAthlete = async () => {
      if (!user?.id) return

      try {
        const { data: athleteData, error: athleteError } = await supabase
          .from('athletes')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (athleteError) {
          console.warn('Error checking user athlete status:', athleteError)
        } else {
          setIsUserAthlete(!!athleteData)
        }
      } catch (error) {
        console.warn('Error checking user athlete status:', error)
      }
    }

    checkUserAthlete()
  }, [user?.id])

  // Enhanced filtered and sorted athletes with logging
  const filteredAndSortedAthletes = useMemo(() => {
    logAthleteSearch('FILTERING_START', {
      totalAthletes: athletes.length,
      searchTerm,
      selectedAthleticFilter,
      selectedStatusFilter,
      selectedSportFilter,
      selectedWhatsAppFilter,
      sortField,
      sortOrder
    })

    const filtered = athletes.filter((athlete) => {
      // Search term filter
      const matchesSearch =
        !searchTerm ||
        athlete.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.user.phone.includes(searchTerm)

      // Athletic filter
      const matchesAthletic = selectedAthleticFilter === 'all' || athlete.athletic_id === selectedAthleticFilter

      // Status filter
      const matchesStatus = selectedStatusFilter === 'all' || athlete.status === selectedStatusFilter

      // Sport filter
      const matchesSport =
        selectedSportFilter === 'all' || athlete.sports.some((sport) => sport.id === selectedSportFilter)

      // WhatsApp filter
      const matchesWhatsApp =
        selectedWhatsAppFilter === 'all' ||
        (selectedWhatsAppFilter === 'sent' && athlete.wpp_sent) ||
        (selectedWhatsAppFilter === 'not_sent' && !athlete.wpp_sent)

      const matches = matchesSearch && matchesAthletic && matchesStatus && matchesSport && matchesWhatsApp

      if (!matches) {
        logAthleteSearch('ATHLETE_FILTERED_OUT', {
          athleteId: athlete.id,
          athleteName: athlete.user.name,
          matchesSearch,
          matchesAthletic,
          matchesStatus,
          matchesSport,
          matchesWhatsApp
        })
      }

      return matches
    })

    logAthleteSearch('FILTERING_COMPLETE', { filteredCount: filtered.length })

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.user.name.toLowerCase()
          bValue = b.user.name.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'athletic':
          aValue = a.athletic.name.toLowerCase()
          bValue = b.athletic.name.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    logAthleteSearch('SORTING_COMPLETE', {
      sortField,
      sortOrder,
      finalCount: filtered.length
    })

    return filtered
  }, [
    athletes,
    searchTerm,
    selectedAthleticFilter,
    selectedStatusFilter,
    selectedSportFilter,
    selectedWhatsAppFilter,
    sortField,
    sortOrder
  ])

  // Handlers
  const handleApproveAthlete = async (athleteId: string) => {
    try {
      await athleteService.updateStatus(athleteId, 'approved')

      toast({
        title: '✅ Atleta aprovado!',
        description: 'O atleta foi aprovado com sucesso e pode participar das competições.'
      })
    } catch (error) {
      toast({
        title: '❌ Erro na aprovação',
        description: 'Não foi possível aprovar o atleta. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  const handleRejectAthlete = async (athleteId: string) => {
    const athlete = athletes.find((a) => a.id === athleteId)
    if (!athlete) return

    logAthleteSearch('REJECT_ATHLETE_DIALOG_OPEN', { athleteId, athleteName: athlete.user.name })
    setSelectedAthleteForRejection(athlete)
    setWhatsappRejectionDialogOpen(true)
  }

  const handleRejectAthleteConfirm = async (customMessage?: string) => {
    if (!selectedAthleteForRejection) return

    setIsRejectionLoading(true)

    try {
      // Update athlete status to rejected
      await athleteService.updateStatus(selectedAthleteForRejection.id, 'rejected')

      // Create WhatsApp message and URL
      const message = formatWhatsAppRejectionMessage(selectedAthleteForRejection.user.name, customMessage)
      const whatsappUrl = createWhatsAppUrl(selectedAthleteForRejection.user.phone, message)

      // Close dialog and reset state
      setWhatsappRejectionDialogOpen(false)
      setSelectedAthleteForRejection(null)

      toast({
        title: '⚠️ Atleta rejeitado',
        description: 'O atleta foi rejeitado e será notificado via WhatsApp.'
      })

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      toast({
        title: '❌ Erro na rejeição',
        description: 'Não foi possível rejeitar o atleta. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsRejectionLoading(false)
    }
  }

  const handleShareLink = async () => {
    if (!athleticId) return

    logAthleteSearch('SHARE_LINK_START', { athleticId })

    try {
      const link = `${window.location.origin}/register?type=athlete&athletic=${athleticId}`
      await navigator.clipboard.writeText(link)

      logAthleteSearch('SHARE_LINK_SUCCESS', { link })

      toast({
        title: '🔗 Link copiado!',
        description: 'O link de cadastro foi copiado para a área de transferência.',
        variant: 'success'
      })
    } catch (error) {
      logAthleteSearch('SHARE_LINK_ERROR', { error })
      toast({
        title: '❌ Erro ao copiar link',
        description: 'Não foi possível copiar o link. Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  const handleViewDocument = (url: string) => {
    logAthleteSearch('VIEW_DOCUMENT', { url })
    setDocumentUrl(url)
    setDocumentDialogOpen(true)
  }

  const handleWhatsApp = (athlete: Athlete) => {
    logAthleteSearch('WHATSAPP_DIALOG_OPEN', { athleteId: athlete.id, athleteName: athlete.user.name })
    setSelectedAthlete(athlete)
    setWhatsappDialogOpen(true)
  }

  const handleWhatsAppConfirm = async () => {
    if (!selectedAthlete || !selectedAthlete.athlete_packages?.length) return

    setIsWhatsAppLoading(true)

    try {
      await athleteService.updateWhatsAppStatus(selectedAthlete.id, true)

      const athletePackage = selectedAthlete.athlete_packages[0]
      const message = formatWhatsAppMessage(
        selectedAthlete.user.name,
        athletePackage.package.name,
        athletePackage.package.price
      )
      const whatsappUrl = createWhatsAppUrl(selectedAthlete.user.phone, message)

      setWhatsappDialogOpen(false)
      setSelectedAthlete(null)

      toast({
        title: '📱 WhatsApp enviado!',
        description: 'O status foi atualizado e você será redirecionado para o WhatsApp.'
      })

      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error updating WhatsApp status:', error)
      toast({
        title: '❌ Erro ao enviar WhatsApp',
        description: 'Não foi possível atualizar o status. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsWhatsAppLoading(false)
    }
  }

  const clearAllFilters = () => {
    logAthleteSearch('CLEAR_ALL_FILTERS')
    setSearchTerm('')
    setSelectedAthleticFilter('all')
    setSelectedStatusFilter('all')
    setSelectedSportFilter('all')
    setSelectedWhatsAppFilter('all')
  }

  const hasActiveFilters =
    searchTerm ||
    selectedAthleticFilter !== 'all' ||
    selectedStatusFilter !== 'all' ||
    selectedSportFilter !== 'all' ||
    selectedWhatsAppFilter !== 'all'

  if (isLoading) {
    return <LoadingState />
  }

  if (fetchError) {
    return <ErrorState error={fetchError} onRetry={refetch} />
  }

  return (
    <div className='min-h-full'>
      <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
        {/* Header */}
        <div className='mb-6 sm:mb-8'>
          <div className='flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-4 lg:gap-6'>
            <div className='space-y-1'>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Atletas</h1>
              <p className='text-sm sm:text-base text-gray-600 leading-relaxed'>
                {userRole === 'admin'
                  ? 'Gerencie todos os atletas do campeonato'
                  : userRole === 'athletic'
                    ? 'Gerencie os atletas da sua atlética'
                    : 'Cadastre-se como atleta ou veja seu status'}
              </p>
            </div>

            <div className='flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 items-stretch sm:items-center'>
              {userRole === 'athletic' && (
                <Button
                  onClick={handleShareLink}
                  className='h-11 px-4 bg-blue-600 hover:bg-blue-700 font-medium text-sm sm:text-base'
                >
                  <Share2 className='h-4 w-4 mr-2 flex-shrink-0' />
                  Copiar link de cadastro
                </Button>
              )}
              <Button
                onClick={() => refetch()}
                variant='outline'
                className='h-11 px-4 font-medium border-gray-300 hover:bg-gray-50 text-sm sm:text-base'
              >
                <RefreshCw className={`h-4 w-4 mr-2 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        <StatisticsCards athletes={athletes} />

        {(userRole === 'admin' || userRole === 'athletic') && (
          <Card className='mb-6 sm:mb-8'>
            <CardContent className='p-4 sm:p-6'>
              <div className='flex flex-col space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900'>Filtros</h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={clearAllFilters}
                    className='self-start sm:self-auto text-xs sm:text-sm'
                  >
                    <X className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                    Limpar filtros
                  </Button>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4'>
                  {userRole === 'admin' && (
                    <Select value={selectedAthleticFilter} onValueChange={setSelectedAthleticFilter}>
                      <SelectTrigger className='h-10 sm:h-11 border-gray-300 text-sm'>
                        <SelectValue placeholder='Todas as Atléticas' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>Todas as Atléticas</SelectItem>
                        {athletics.map((athletic) => (
                          <SelectItem key={athletic.id} value={athletic.id}>
                            {athletic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                    <SelectTrigger className='h-10 sm:h-11 border-gray-300 text-sm'>
                      <SelectValue placeholder='Todos os Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos os Status</SelectItem>
                      <SelectItem value='pending'>Enviado</SelectItem>
                      <SelectItem value='approved'>Aprovado</SelectItem>
                      <SelectItem value='rejected'>Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedSportFilter} onValueChange={setSelectedSportFilter}>
                    <SelectTrigger className='h-10 sm:h-11 border-gray-300 text-sm'>
                      <SelectValue placeholder='Todas as Modalidades' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todas as Modalidades</SelectItem>
                      {sports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split('-') as [SortField, SortOrder]
                      setSortField(field)
                      setSortOrder(order)
                    }}
                  >
                    <SelectTrigger className='h-10 sm:h-11 border-gray-300 text-sm'>
                      <SelectValue placeholder='Ordenar por' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='name-asc'>Nome (A-Z)</SelectItem>
                      <SelectItem value='name-desc'>Nome (Z-A)</SelectItem>
                      <SelectItem value='created_at-desc'>Data de Cadastro</SelectItem>
                      <SelectItem value='created_at-asc'>Data de Cadastro</SelectItem>
                      <SelectItem value='status-asc'>Status</SelectItem>
                      <SelectItem value='athletic-asc'>Atlética</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      placeholder='Buscar atletas...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='h-10 sm:h-11 pl-10 border-gray-300 text-sm'
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredAndSortedAthletes.length > 0 && (
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6'>
            <div className='flex items-center space-x-2'>
              <TrendingUp className='h-4 w-4 text-blue-600 flex-shrink-0' />
              <span className='font-medium text-blue-900 text-sm sm:text-base'>
                {filteredAndSortedAthletes.length} atleta{filteredAndSortedAthletes.length !== 1 ? 's' : ''} encontrado
                {filteredAndSortedAthletes.length !== 1 ? 's' : ''}
              </span>
            </div>
            {hasActiveFilters && (
              <div className='flex items-center space-x-2'>
                <Sparkles className='h-4 w-4 text-blue-600 flex-shrink-0' />
                <span className='text-xs sm:text-sm text-blue-700 font-medium'>Filtros ativos</span>
              </div>
            )}
          </div>
        )}

        <div className='space-y-4 sm:space-y-6'>
          {isLoading ? (
            <div className='flex justify-center items-center py-12'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600'></div>
            </div>
          ) : filteredAndSortedAthletes.length === 0 ? (
            <Card>
              <CardContent className='p-8 sm:p-12 text-center'>
                <Users className='h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-2'>Nenhum atleta encontrado</h3>
                <p className='text-sm sm:text-base text-gray-600 max-w-md mx-auto'>
                  {searchTerm || hasActiveFilters
                    ? 'Tente ajustar os filtros ou termo de busca para encontrar atletas.'
                    : 'Ainda não há atletas cadastrados no sistema.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedAthletes.map((athlete) => (
              <AthleteCard
                key={athlete.id}
                athlete={athlete}
                userRole={userRole}
                onApprove={handleApproveAthlete}
                onReject={handleRejectAthlete}
                onWhatsApp={handleWhatsApp}
                onViewDocument={handleViewDocument}
              />
            ))
          )}
        </div>
      </div>

      <DocumentModal
        isOpen={documentDialogOpen}
        onClose={() => setDocumentDialogOpen(false)}
        documentUrl={documentUrl}
        title='Documento do Atleta'
      />

      {/* WhatsApp Confirmation Dialog */}
      <WhatsAppConfirmationDialog
        athlete={selectedAthlete}
        isOpen={whatsappDialogOpen}
        onClose={() => {
          setWhatsappDialogOpen(false)
          setSelectedAthlete(null)
        }}
        onConfirm={handleWhatsAppConfirm}
        isLoading={isWhatsAppLoading}
      />

      {/* WhatsApp Rejection Dialog */}
      <WhatsAppRejectionDialog
        athlete={selectedAthleteForRejection}
        isOpen={whatsappRejectionDialogOpen}
        onClose={() => {
          setWhatsappRejectionDialogOpen(false)
          setSelectedAthleteForRejection(null)
        }}
        onConfirm={handleRejectAthleteConfirm}
        isLoading={isRejectionLoading}
      />
    </div>
  )
}

function AthleteCard({ athlete, userRole, onApprove, onReject, onWhatsApp, onViewDocument }: AthleteCardProps) {
  const hasPackage = athlete.athlete_packages && athlete.athlete_packages.length > 0
  const sports = athlete.sports || []

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <Card className='hover:shadow-lg transition-all duration-200 border border-gray-200'>
        <CardContent className='p-4 sm:p-6'>
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4 mb-4'>
            <div className='flex items-start space-x-3 min-w-0 flex-1'>
              <div className='flex-shrink-0'>
                <div className='w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center'>
                  <span className='text-white font-bold text-lg sm:text-xl'>
                    {athlete.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className='min-w-0 flex-1'>
                <h3 className='text-lg sm:text-xl font-bold text-gray-900 truncate'>{athlete.user.name}</h3>
                <p className='text-sm text-gray-600 truncate'>{athlete.athletic.name}</p>
                <div className='flex items-center space-x-2 mt-1'>
                  <StatusBadge status={athlete.status} />
                  {hasPackage && (
                    <Badge variant='secondary' className='text-xs bg-green-50 text-green-700 border-green-200'>
                      Com pacote
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='mb-4'>
            <h4 className='text-sm font-semibold text-gray-700 mb-2'>Modalidades:</h4>
            <div className='flex flex-wrap gap-1.5'>
              {sports.slice(0, 4).map((sport) => (
                <Badge
                  key={sport.id}
                  variant='secondary'
                  className={`text-xs font-medium px-2 py-1 ${
                    sport.type === 'sport'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {sport.name}
                </Badge>
              ))}
              {sports.length > 4 && (
                <Badge variant='secondary' className='text-xs bg-slate-50 text-slate-600 px-2 py-1 font-medium'>
                  +{sports.length - 4} mais
                </Badge>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4'>
            <div className='flex items-center space-x-2 text-gray-600'>
              <Mail className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium truncate'>{athlete.user.email}</span>
            </div>
            <div className='flex items-center space-x-2 text-gray-600'>
              <Phone className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium'>{athlete.user.phone}</span>
            </div>
            <div className='flex items-center space-x-2 text-gray-600'>
              <Calendar className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium'>{new Date(athlete.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className='flex items-center space-x-2 text-gray-600'>
              <Trophy className='h-4 w-4 text-gray-400 flex-shrink-0' />
              <span className='text-sm font-medium'>{athlete.sports.length} modalidades</span>
            </div>
          </div>

          <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pt-4 border-t border-gray-100'>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onViewDocument(athlete.cnh_cpf_document_url)}
                disabled={!athlete.cnh_cpf_document_url}
                className='h-9 px-3 text-xs sm:text-sm font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              >
                <Eye className='h-3 w-3 sm:h-4 sm:w-4 mr-1.5' />
                Documento
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onViewDocument(athlete.enrollment_document_url)}
                disabled={!athlete.enrollment_document_url}
                className='h-9 px-3 text-xs sm:text-sm font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              >
                <FileCheck className='h-3 w-3 sm:h-4 sm:w-4 mr-1.5' />
                Matrícula
              </Button>
              {athlete.status === 'approved' && hasPackage && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onWhatsApp(athlete)}
                  className={`h-9 px-3 text-xs sm:text-sm font-medium border transition-colors ${
                    athlete.wpp_sent
                      ? 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'
                      : 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  <MessageCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1.5' />
                  <span className='hidden sm:inline'>{athlete.wpp_sent ? 'Reenviar mensagem' : 'Enviar mensagem'}</span>
                  <span className='sm:hidden'>{athlete.wpp_sent ? 'Reenviar' : 'Enviar'}</span>
                </Button>
              )}
            </div>

            {(userRole === 'admin' || userRole === 'athletic') && athlete.status === 'sent' && (
              <div className='flex gap-2 sm:gap-3'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onReject(athlete.id)}
                  className='h-9 px-3 text-xs sm:text-sm font-medium border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors'
                >
                  <UserX className='h-3 w-3 sm:h-4 sm:w-4 mr-1.5' />
                  <span className='hidden sm:inline'>Rejeitar</span>
                  <span className='sm:hidden'>Rejeitar</span>
                </Button>
                <Button
                  size='sm'
                  onClick={() => onApprove(athlete.id)}
                  className='h-9 px-3 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-medium shadow-md'
                >
                  <UserCheck className='h-3 w-3 sm:h-4 sm:w-4 mr-1.5' />
                  <span className='hidden sm:inline'>Aprovar</span>
                  <span className='sm:hidden'>Aprovar</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
