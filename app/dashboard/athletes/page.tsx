'use client'

import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  Share2,
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Trophy,
  Eye,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  MessageCircle,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  Sparkles,
  TrendingUp,
  FileCheck,
  ExternalLink,
  X,
  Info,
  Building2,
  CreditCard
} from 'lucide-react'
import { useEffect, useState, useMemo, useCallback } from 'react'

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
    type: 'sport' | 'bar_game'
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
  type: 'sport' | 'bar_game'
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

// Custom Hooks
const useAthletes = (user: any, userRole: string | null) => {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [athleticId, setAthleticId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const fetchData = useCallback(async () => {
    if (!user) {
      logAthleteSearch('FETCH_SKIPPED', { reason: 'No user provided' })
      return
    }

    setIsLoading(true)
    setFetchError(null)
    logAthleteSearch('FETCH_START', { userId: user.id, userRole })

    try {
      let athleticIdForQuery: string | null = null

      // Step 1: Get athletic ID if user is athletic representative
      if (userRole === 'athletic') {
        logAthleteSearch('FETCHING_ATHLETIC_ID', { userId: user.id })
        const { data: athleticData, error: athleticError } = await supabase
          .from('athletics')
          .select('id, name')
          .eq('representative_id', user.id)
          .maybeSingle()

        if (athleticError) {
          logAthleteSearch('ATHLETIC_ID_ERROR', { error: athleticError })
          throw new Error(`Erro ao buscar atlética: ${athleticError.message}`)
        }

        if (athleticData) {
          athleticIdForQuery = athleticData.id
          setAthleticId(athleticData.id)
          logAthleteSearch('ATHLETIC_ID_FOUND', { athleticId: athleticData.id, athleticName: athleticData.name })
        } else {
          logAthleteSearch('ATHLETIC_ID_NOT_FOUND', { userId: user.id })
          setFetchError('Atlética não encontrada para este usuário')
          return
        }
      }

      // Step 2: Build athletes query with proper joins
      logAthleteSearch('BUILDING_ATHLETES_QUERY', { userRole, athleticIdForQuery })
      const athletesQuery = supabase
        .from('athletes')
        .select(
          `
          id,
          user_id,
          athletic_id,
          enrollment_document_url,
          status,
          created_at,
          cnh_cpf_document_url,
          wpp_sent,
          user:users!athletes_user_id_fkey(
            name,
            email,
            cpf,
            phone,
            gender
          ),
          athletic:athletics!athletes_athletic_id_fkey(
            name
          ),
          athlete_sports!athlete_sports_athlete_id_fkey(
            sport:sports!athlete_sports_sport_id_fkey(
              id,
              name,
              type
            )
          ),
          athlete_packages!athlete_packages_athlete_id_fkey(
            id,
            payment_status,
            package:packages!athlete_packages_package_id_fkey(
              id,
              name,
              price,
              description
            )
          )
        `
        )
        .order('created_at', { ascending: false })

      // Apply filters based on user role and search params
      if (userRole === 'admin') {
        const athleticFilter = searchParams.get('athletic')
        logAthleteSearch('ADMIN_FILTER_APPLIED', { athleticFilter })
        if (athleticFilter && athleticFilter !== 'all') {
          athletesQuery.eq('athletic_id', athleticFilter)
        }
      } else if (userRole === 'athletic' && athleticIdForQuery) {
        logAthleteSearch('ATHLETIC_FILTER_APPLIED', { athleticId: athleticIdForQuery })
        athletesQuery.eq('athletic_id', athleticIdForQuery)
      } else if (userRole !== 'admin' && userRole !== 'athletic') {
        // For regular users, show only their own athlete record
        logAthleteSearch('USER_FILTER_APPLIED', { userId: user.id })
        athletesQuery.eq('user_id', user.id)
      }

      // Step 3: Execute athletes query
      logAthleteSearch('EXECUTING_ATHLETES_QUERY')
      const { data: athletesData, error: athletesError } = await athletesQuery

      if (athletesError) {
        logAthleteSearch('ATHLETES_QUERY_ERROR', { error: athletesError })
        throw new Error(`Erro ao buscar atletas: ${athletesError.message}`)
      }

      // Step 4: Format athletes data
      const formattedAthletes =
        athletesData
          ?.map((athlete) => {
            const formattedAthlete = {
              ...athlete,
              sports: athlete.athlete_sports?.map((as: any) => as.sport).filter(Boolean) || [],
              athlete_packages: athlete.athlete_packages || []
            }

            // Validate required fields
            if (!formattedAthlete.user) {
              logAthleteSearch('ATHLETE_MISSING_USER', { athleteId: athlete.id })
            }
            if (!formattedAthlete.athletic) {
              logAthleteSearch('ATHLETE_MISSING_ATHLETIC', { athleteId: athlete.id })
            }

            return formattedAthlete
          })
          .filter((athlete) => athlete.user && athlete.athletic) || []

      setAthletes(formattedAthletes as unknown as Athlete[])
      logAthleteSearch('ATHLETES_SET', { count: formattedAthletes.length })

      // Step 5: Fetch athletics for admin users
      if (userRole === 'admin') {
        logAthleteSearch('FETCHING_ATHLETICS_LIST')
        const { data: athleticsData, error: athleticsError } = await supabase
          .from('athletics')
          .select('id, name, university')
          .order('name')

        if (athleticsError) {
          logAthleteSearch('ATHLETICS_LIST_ERROR', { error: athleticsError })
          console.warn('Error fetching athletics:', athleticsError)
        } else {
          setAthletics(athleticsData as Athletic[])
          logAthleteSearch('ATHLETICS_LIST_SUCCESS', { count: athleticsData?.length || 0 })
        }
      }

      // Step 6: Fetch sports
      logAthleteSearch('FETCHING_SPORTS')
      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('id, name, type')
        .order('name')

      if (sportsError) {
        logAthleteSearch('SPORTS_ERROR', { error: sportsError })
        console.warn('Error fetching sports:', sportsError)
      } else {
        setSports(sportsData as Sport[])
        logAthleteSearch('SPORTS_SUCCESS', { count: sportsData?.length || 0 })
      }

      // Step 7: Fetch packages with fallback
      logAthleteSearch('FETCHING_PACKAGES')
      try {
        const { data: packagesData, error: packagesError } = await supabase
          .from('packages')
          .select('id, name, price, description')
          .order('name')

        if (packagesError) {
          logAthleteSearch('PACKAGES_ERROR', { error: packagesError })
          throw packagesError
        }

        setPackages(packagesData as Package[])
        logAthleteSearch('PACKAGES_SUCCESS', { count: packagesData?.length || 0 })
      } catch (error) {
        logAthleteSearch('PACKAGES_FALLBACK', { error })
        // Fallback packages
        const fallbackPackages = [
          { id: '1', name: 'Pacote Básico', price: 50.0, description: 'Pacote básico de participação' },
          { id: '2', name: 'Pacote Premium', price: 100.0, description: 'Pacote premium com benefícios extras' },
          { id: '3', name: 'Pacote VIP', price: 150.0, description: 'Pacote VIP com todos os benefícios' }
        ]
        setPackages(fallbackPackages)
      }

      logAthleteSearch('FETCH_COMPLETE', {
        athletesCount: formattedAthletes.length,
        athleticsCount: userRole === 'admin' ? athletics.length : 0,
        sportsCount: sports.length,
        packagesCount: packages.length
      })
    } catch (error: any) {
      logAthleteSearch('FETCH_ERROR', { error })
      setFetchError(error.message || 'Erro desconhecido ao carregar dados')
      console.error('Error fetching athlete data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, userRole, searchParams, athletics.length, packages.length, sports.length])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    athletes,
    setAthletes,
    athletics,
    sports,
    packages,
    isLoading,
    athleticId,
    fetchError,
    refetch: fetchData
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
      <DialogContent className='w-[98vw] sm:w-[90vw] md:w-[600px] lg:w-[700px] xl:w-[750px] max-w-[98vw] h-[95vh] sm:h-[90vh] md:h-auto md:max-h-[85vh] rounded-2xl sm:rounded-3xl border-0 shadow-2xl bg-white p-0 overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-green-100 flex-shrink-0'>
          <DialogHeader className='text-center space-y-3 sm:space-y-4'>
            <div className='mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-200'>
              <MessageCircle className='h-8 w-8 sm:h-10 sm:w-10 text-white' />
            </div>
            <div className='space-y-1 sm:space-y-2'>
              <DialogTitle className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight'>
                Confirmar Envio
              </DialogTitle>
              <p className='text-gray-600 text-sm sm:text-base font-medium'>Revise as informações antes de enviar</p>
            </div>
          </DialogHeader>
        </div>

        <div className='px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0'>
          <div className='bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4'>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0'>
                <Building2 className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600' />
              </div>
              <div className='flex-1 min-w-0 text-center sm:text-left'>
                <h3 className='font-bold text-gray-900 text-lg sm:text-xl break-words'>{athlete.user.name}</h3>
                <div className='flex items-center justify-center sm:justify-start space-x-2 mt-1'>
                  <Phone className='h-4 w-4 text-gray-500' />
                  <p className='text-sm text-gray-600 font-medium'>{athlete.user.phone}</p>
                </div>
                <p className='text-xs text-gray-500 mt-2 bg-gray-100 px-2 py-1 rounded-lg inline-block'>
                  {athlete.athletic.name}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0'>
              <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 flex-1'>
                <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0'>
                  <CreditCard className='h-5 w-5 sm:h-6 sm:w-6 text-white' />
                </div>
                <div className='flex-1 min-w-0 text-center sm:text-left'>
                  <p className='text-sm font-semibold text-blue-700 mb-1'>Pacote Selecionado</p>
                  <h4 className='font-bold text-blue-900 text-base sm:text-lg leading-tight break-words'>
                    {athletePackage.package.name}
                  </h4>
                </div>
              </div>
              <div className='text-center sm:text-right sm:ml-4'>
                <div className='bg-white rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 shadow-sm border border-blue-200 inline-block'>
                  <p className='text-xl sm:text-2xl font-bold text-blue-700'>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(athletePackage.package.price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-green-300 shadow-lg'>
            <div className='flex items-start space-x-3 mb-4'>
              <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md'>
                <MessageCircle className='h-5 w-5 text-white' />
              </div>
              <div className='flex-1'>
                <p className='text-sm sm:text-base font-bold text-green-800 mb-1'>📱 Mensagem WhatsApp</p>
                <p className='text-xs text-green-700'>Esta mensagem será enviada automaticamente</p>
              </div>
            </div>
            <div className='bg-white rounded-xl p-4 sm:p-5 border-2 border-green-200 shadow-inner relative overflow-hidden'>
              <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500'></div>
              <div className='flex items-start space-x-3 pt-2'>
                <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0'>
                  <span className='text-white text-xs font-bold'>W</span>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs text-gray-500 mb-1 font-medium'>WhatsApp Business</p>
                  <div className='bg-green-50 rounded-lg p-3 border border-green-200'>
                    <p className='text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap break-words font-medium'>
                      {message}
                    </p>
                  </div>
                  <p className='text-xs text-gray-400 mt-2 text-right'>Agora ✓✓</p>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3'>
              <div className='w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0'>
                <Info className='h-4 w-4 text-white' />
              </div>
              <div className='flex-1 text-center sm:text-left'>
                <p className='text-sm font-semibold text-amber-800 mb-1'>⚠️ Importante</p>
                <p className='text-xs sm:text-sm text-amber-700 leading-relaxed'>
                  Após confirmar, o status será marcado como &quot;WhatsApp Enviado&quot; e você será redirecionado
                  automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='px-4 sm:px-6 py-4 sm:py-6 bg-gray-50 border-t border-gray-100 flex-shrink-0'>
          <DialogFooter className='flex flex-col sm:flex-row gap-3'>
            <Button
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
              className='w-full sm:w-auto h-11 sm:h-12 font-semibold border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 bg-transparent text-sm sm:text-base'
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className='w-full sm:w-auto h-11 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base'
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin' />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
                  Confirmar e Enviar
                </>
              )}
            </Button>
          </DialogFooter>
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
      <DialogContent className='w-[98vw] sm:w-[90vw] md:w-[650px] lg:w-[750px] xl:w-[800px] max-w-[98vw] h-[95vh] sm:h-[90vh] md:h-auto md:max-h-[85vh] rounded-2xl sm:rounded-3xl border-0 shadow-2xl bg-white p-0 overflow-hidden flex flex-col'>
        <div className='bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-red-100 flex-shrink-0'>
          <DialogHeader className='text-center space-y-3 sm:space-y-4'>
            <div className='mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-400 via-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-red-200'>
              <UserX className='h-8 w-8 sm:h-10 sm:w-10 text-white' />
            </div>
            <div className='space-y-1 sm:space-y-2'>
              <DialogTitle className='text-xl sm:text-2xl font-bold text-gray-900 leading-tight'>
                Rejeitar Cadastro
              </DialogTitle>
              <p className='text-gray-600 text-sm sm:text-base font-medium'>O atleta será notificado via WhatsApp</p>
            </div>
          </DialogHeader>
        </div>

        <div className='px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0'>
          <div className='bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4'>
              <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0'>
                <Building2 className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600' />
              </div>
              <div className='flex-1 min-w-0 text-center sm:text-left'>
                <h3 className='font-bold text-gray-900 text-lg sm:text-xl break-words'>{athlete.user.name}</h3>
                <div className='flex items-center justify-center sm:justify-start space-x-2 mt-1'>
                  <Phone className='h-4 w-4 text-gray-500' />
                  <p className='text-sm text-gray-600 font-medium'>{athlete.user.phone}</p>
                </div>
                <p className='text-xs text-gray-500 mt-2 bg-gray-100 px-2 py-1 rounded-lg inline-block'>
                  {athlete.athletic.name}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm'>
            <div className='space-y-4'>
              <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3'>
                <div className='w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0'>
                  <AlertCircle className='h-4 w-4 text-white' />
                </div>
                <div className='flex-1 text-center sm:text-left'>
                  <p className='text-sm font-semibold text-amber-800 mb-1'>Motivo da Rejeição (Opcional)</p>
                  <p className='text-xs text-amber-700'>Adicione uma mensagem explicando o motivo da rejeição</p>
                </div>
              </div>
              <Textarea
                placeholder='Ex: Documento ilegível, informações incompletas, etc.'
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className='min-h-[80px] sm:min-h-[100px] border-amber-200 focus:border-amber-400 focus:ring-amber-400 rounded-lg sm:rounded-xl resize-none text-sm sm:text-base'
                maxLength={500}
              />
              <div className='text-right'>
                <span className='text-xs text-amber-600 font-medium'>{customMessage.length}/500 caracteres</span>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-br from-red-100 via-red-50 to-rose-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-red-300 shadow-lg'>
            <div className='flex items-start space-x-3 mb-4'>
              <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md'>
                <MessageCircle className='h-5 w-5 text-white' />
              </div>
              <div className='flex-1'>
                <p className='text-sm sm:text-base font-bold text-red-800 mb-1'>📱 Mensagem WhatsApp</p>
                <p className='text-xs text-red-700'>Esta mensagem será enviada automaticamente</p>
              </div>
            </div>
            <div className='bg-white rounded-xl p-4 sm:p-5 border-2 border-red-200 shadow-inner relative overflow-hidden'>
              <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-rose-500'></div>
              <div className='flex items-start space-x-3 pt-2'>
                <div className='w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0'>
                  <span className='text-white text-xs font-bold'>W</span>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-xs text-gray-500 mb-1 font-medium'>WhatsApp Business</p>
                  <div className='bg-red-50 rounded-lg p-3 border border-red-200 max-h-24 sm:max-h-32 overflow-y-auto'>
                    <p className='text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-line break-words font-medium'>
                      {message}
                    </p>
                  </div>
                  <p className='text-xs text-gray-400 mt-2 text-right'>Agora ✓✓</p>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3'>
              <div className='w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0'>
                <ExternalLink className='h-4 w-4 text-white' />
              </div>
              <div className='flex-1 text-center sm:text-left'>
                <p className='text-sm font-semibold text-blue-800 mb-1'>🔗 Link de Correção</p>
                <p className='text-xs text-blue-700 mb-3 leading-relaxed'>
                  O atleta receberá um link direto para corrigir as informações
                </p>
                <div className='bg-blue-100 rounded-lg p-3 border border-blue-200'>
                  <p className='text-xs text-blue-800 font-mono break-all'>
                    {typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/profile
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3'>
              <div className='w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0'>
                <Info className='h-4 w-4 text-white' />
              </div>
              <div className='flex-1 text-center sm:text-left'>
                <p className='text-sm font-semibold text-gray-800 mb-2'>ℹ️ O que acontecerá:</p>
                <ul className='text-xs sm:text-sm text-gray-700 space-y-2'>
                  <li className='flex items-start space-x-2'>
                    <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0'></span>
                    <span>O status do atleta será alterado para &quot;Rejeitado&quot;</span>
                  </li>
                  <li className='flex items-start space-x-2'>
                    <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0'></span>
                    <span>Uma mensagem será enviada via WhatsApp automaticamente</span>
                  </li>
                  <li className='flex items-start space-x-2'>
                    <span className='w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0'></span>
                    <span>O atleta poderá corrigir e reenviar a documentação</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className='px-4 sm:px-6 py-4 sm:py-6 bg-gray-50 border-t border-gray-100 flex-shrink-0'>
          <DialogFooter className='flex flex-col sm:flex-row gap-3'>
            <Button
              variant='outline'
              onClick={handleClose}
              disabled={isLoading}
              className='w-full sm:w-auto h-11 sm:h-12 font-semibold border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 bg-transparent text-sm sm:text-base'
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className='w-full sm:w-auto h-11 sm:h-12 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base'
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin' />
                  Rejeitando...
                </>
              ) : (
                <>
                  <UserX className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
                  Rejeitar e Enviar
                </>
              )}
            </Button>
          </DialogFooter>
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
  const [userRole, setUserRole] = useState<string | null>(null)
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

  const { athletes, setAthletes, athletics, sports, packages, isLoading, athleticId, fetchError, refetch } =
    useAthletes(user, userRole)

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return

      logAthleteSearch('FETCHING_USER_ROLE', { userId: user.id })

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userError) {
          logAthleteSearch('USER_ROLE_ERROR', { error: userError })
          throw userError
        }

        if (userData) {
          setUserRole(userData.role)
          logAthleteSearch('USER_ROLE_SUCCESS', { role: userData.role })
        }

        const { data: athleteData, error: athleteError } = await supabase
          .from('athletes')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (athleteError) {
          logAthleteSearch('USER_ATHLETE_CHECK_ERROR', { error: athleteError })
        } else {
          setIsUserAthlete(!!athleteData)
          logAthleteSearch('USER_ATHLETE_CHECK_SUCCESS', { isAthlete: !!athleteData })
        }
      } catch (error) {
        logAthleteSearch('FETCH_USER_ROLE_ERROR', { error })
        console.warn('Error fetching user role:', error)
      }
    }

    fetchUserRole()
  }, [user])

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
    logAthleteSearch('APPROVE_ATHLETE_START', { athleteId })
    try {
      const { error } = await supabase.from('athletes').update({ status: 'approved' }).eq('id', athleteId)

      if (error) throw error

      setAthletes((prev) =>
        prev.map((athlete) => (athlete.id === athleteId ? { ...athlete, status: 'approved' } : athlete))
      )

      logAthleteSearch('APPROVE_ATHLETE_SUCCESS', { athleteId })

      toast({
        title: '✅ Atleta aprovado!',
        description: 'O atleta foi aprovado com sucesso e pode participar das competições.'
      })
    } catch (error) {
      logAthleteSearch('APPROVE_ATHLETE_ERROR', { athleteId, error })
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
    logAthleteSearch('REJECT_ATHLETE_START', { athleteId: selectedAthleteForRejection.id })

    try {
      // Update athlete status to rejected
      const { error } = await supabase
        .from('athletes')
        .update({ status: 'rejected' })
        .eq('id', selectedAthleteForRejection.id)

      if (error) throw error

      // Update local state
      setAthletes((prev) =>
        prev.map((athlete) =>
          athlete.id === selectedAthleteForRejection.id ? { ...athlete, status: 'rejected' } : athlete
        )
      )

      // Create WhatsApp message and URL
      const message = formatWhatsAppRejectionMessage(selectedAthleteForRejection.user.name, customMessage)
      const whatsappUrl = createWhatsAppUrl(selectedAthleteForRejection.user.phone, message)

      // Close dialog and reset state
      setWhatsappRejectionDialogOpen(false)
      setSelectedAthleteForRejection(null)

      logAthleteSearch('REJECT_ATHLETE_SUCCESS', {
        athleteId: selectedAthleteForRejection.id,
        whatsappUrl,
        customMessage
      })

      toast({
        title: '⚠️ Atleta rejeitado',
        description: 'O atleta foi rejeitado e será notificado via WhatsApp.'
      })

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      logAthleteSearch('REJECT_ATHLETE_ERROR', { athleteId: selectedAthleteForRejection.id, error })
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
        description: 'O link de cadastro foi copiado para a área de transferência.'
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
    logAthleteSearch('WHATSAPP_SEND_START', { athleteId: selectedAthlete.id })

    try {
      const { error } = await supabase.from('athletes').update({ wpp_sent: true }).eq('id', selectedAthlete.id)

      if (error) throw error

      setAthletes((prev) =>
        prev.map((athlete) => (athlete.id === selectedAthlete.id ? { ...athlete, wpp_sent: true } : athlete))
      )

      const athletePackage = selectedAthlete.athlete_packages[0]
      const message = formatWhatsAppMessage(
        selectedAthlete.user.name,
        athletePackage.package.name,
        athletePackage.package.price
      )
      const whatsappUrl = createWhatsAppUrl(selectedAthlete.user.phone, message)

      setWhatsappDialogOpen(false)
      setSelectedAthlete(null)

      logAthleteSearch('WHATSAPP_SEND_SUCCESS', {
        athleteId: selectedAthlete.id,
        whatsappUrl
      })

      toast({
        title: '📱 WhatsApp enviado!',
        description: 'O status foi atualizado e você será redirecionado para o WhatsApp.'
      })

      window.open(whatsappUrl, '_blank')
    } catch (error) {
      logAthleteSearch('WHATSAPP_SEND_ERROR', {
        athleteId: selectedAthlete.id,
        error
      })
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

      {/* Document Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh]'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-gray-900'>Visualizar Documento</DialogTitle>
          </DialogHeader>
          <div className='mt-4 flex-1 min-h-0'>
            {documentUrl ? (
              <div className='w-full h-[70vh] rounded-lg overflow-hidden border border-gray-200'>
                <iframe src={documentUrl} className='w-full h-full' title='Documento' />
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
