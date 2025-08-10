'use client'

import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Star,
  MessageCircle,
  CheckCircle,
  XCircle,
  Send,
  SlidersHorizontal,
  RefreshCw,
  ChevronDown,
  Sparkles,
  TrendingUp,
  FileCheck
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

// WhatsApp Confirmation Dialog
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
      <DialogContent className='max-w-lg mx-4 rounded-2xl'>
        <DialogHeader className='text-center pb-4'>
          <div className='mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4'>
            <MessageCircle className='h-8 w-8 text-white' />
          </div>
          <DialogTitle className='text-2xl font-bold text-gray-900'>Confirmar Envio WhatsApp</DialogTitle>
          <p className='text-gray-600 mt-2'>Revise as informações antes de enviar a mensagem</p>
        </DialogHeader>
        <div className='space-y-6'>
          <div className='bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200'>
            <div className='space-y-2'>
              <p className='font-bold text-gray-900 text-xl'>{athlete.user.name}</p>
              <p className='text-sm text-gray-600'>{athlete.user.phone}</p>
              <p className='text-xs text-gray-500'>{athlete.athletic.name}</p>
            </div>
          </div>

          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-blue-900 mb-1'>Pacote Selecionado</p>
                <p className='font-bold text-blue-900 text-lg'>{athletePackage.package.name}</p>
              </div>
              <div className='text-right'>
                <p className='text-2xl font-bold text-blue-700'>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(athletePackage.package.price)}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200'>
            <p className='text-sm font-medium text-green-900 mb-3'>Mensagem que será enviada:</p>
            <div className='bg-white rounded-lg p-3 border border-green-200'>
              <p className='text-sm text-gray-700 italic leading-relaxed'>&quot;{message}&quot;</p>
            </div>
          </div>

          <div className='bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200'>
            <div className='flex items-start space-x-3'>
              <AlertCircle className='h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-amber-900'>Importante</p>
                <p className='text-xs text-amber-800 mt-1'>
                  Ap&oacute;s confirmar, o status ser&aacute; marcado como &quot;WhatsApp Enviado&quot; e voc&ecirc;
                  ser&aacute; redirecionado automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='flex flex-col sm:flex-row gap-3 pt-6'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={isLoading}
            className='flex-1 h-12 font-semibold border-2 hover:bg-gray-50 bg-transparent'
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className='flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-semibold shadow-lg'
          >
            {isLoading ? (
              <>
                <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                Enviando...
              </>
            ) : (
              <>
                <Send className='h-5 w-5 mr-2' />
                Confirmar e Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
                  Enviar mensagem 
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
    logAthleteSearch('REJECT_ATHLETE_START', { athleteId })

    try {
      const { error } = await supabase.from('athletes').update({ status: 'rejected' }).eq('id', athleteId)
      if (error) throw error

      setAthletes((prev) =>
        prev.map((athlete) => (athlete.id === athleteId ? { ...athlete, status: 'rejected' } : athlete))
      )

      logAthleteSearch('REJECT_ATHLETE_SUCCESS', { athleteId })
      toast({
        title: '⚠️ Atleta rejeitado',
        description: 'O atleta foi rejeitado e precisará revisar sua documentação.'
      })
    } catch (error) {
      logAthleteSearch('REJECT_ATHLETE_ERROR', { athleteId, error })
      toast({
        title: '❌ Erro na rejeição',
        description: 'Não foi possível rejeitar o atleta. Tente novamente.',
        variant: 'destructive'
      })
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
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
            <div className='space-y-1'>
              <h1 className='text-3xl font-bold text-gray-900'>Atletas</h1>
              <p className='text-gray-600'>
                {userRole === 'admin'
                  ? 'Gerencie todos os atletas do campeonato'
                  : userRole === 'athletic'
                    ? 'Gerencie os atletas da sua atlética'
                    : 'Cadastre-se como atleta ou veja seu status'}
              </p>
            </div>

            {/* Header Actions */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
              {userRole === 'athletic' && (
                <Button onClick={handleShareLink} className='h-10 px-4 bg-blue-600 hover:bg-blue-700 font-medium'>
                  <Share2 className='h-4 w-4 mr-2' />
                  Compartilhar Link
                </Button>
              )}

              <Button
                onClick={() => refetch()}
                variant='outline'
                className='h-10 px-4 font-medium border-gray-300 hover:bg-gray-50'
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {userRole === 'athletic' || userRole === 'admin' ? (
          <div className='space-y-6'>
            {/* Statistics Cards */}
            <StatisticsCards athletes={athletes} />

            {/* Filters */}
            <Card className='border border-gray-200 bg-white'>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  {/* Search Bar */}
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                    <Input
                      placeholder='Buscar por nome, email ou telefone...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    />
                  </div>

                  {/* Filter Toggle */}
                  <div className='flex items-center justify-between'>
                    <Button
                      variant='outline'
                      onClick={() => setShowFilters(!showFilters)}
                      className='h-10 px-4 font-medium border-gray-300 hover:bg-gray-50'
                    >
                      <SlidersHorizontal className='h-4 w-4 mr-2' />
                      Filtros Avançados
                      <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>

                    {hasActiveFilters && (
                      <Button
                        variant='ghost'
                        onClick={clearAllFilters}
                        className='h-10 px-4 font-medium text-red-600 hover:bg-red-50 hover:text-red-700'
                      >
                        <XCircle className='h-4 w-4 mr-2' />
                        Limpar Filtros
                      </Button>
                    )}
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                      {userRole === 'admin' && (
                        <Select value={selectedAthleticFilter} onValueChange={setSelectedAthleticFilter}>
                          <SelectTrigger className='h-10 border-gray-300'>
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
                        <SelectTrigger className='h-10 border-gray-300'>
                          <SelectValue placeholder='Todos os Status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>Todos os Status</SelectItem>
                          <SelectItem value='pending'>Pendentes</SelectItem>
                          <SelectItem value='sent'>Em Análise</SelectItem>
                          <SelectItem value='approved'>Aprovados</SelectItem>
                          <SelectItem value='rejected'>Rejeitados</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedSportFilter} onValueChange={setSelectedSportFilter}>
                        <SelectTrigger className='h-10 border-gray-300'>
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

                      {userRole === 'athletic' && (
                        <Select value={selectedWhatsAppFilter} onValueChange={setSelectedWhatsAppFilter}>
                          <SelectTrigger className='h-10 border-gray-300'>
                            <SelectValue placeholder='Status WhatsApp' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>Todos</SelectItem>
                            <SelectItem value='sent'>WhatsApp Enviado</SelectItem>
                            <SelectItem value='not_sent'>WhatsApp Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      <Select
                        value={`${sortField}-${sortOrder}`}
                        onValueChange={(value) => {
                          const [field, order] = value.split('-') as [SortField, SortOrder]
                          setSortField(field)
                          setSortOrder(order)
                        }}
                      >
                        <SelectTrigger className='h-10 border-gray-300'>
                          <SelectValue placeholder='Ordenar por' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='name-asc'>Nome (A-Z)</SelectItem>
                          <SelectItem value='name-desc'>Nome (Z-A)</SelectItem>
                          <SelectItem value='created_at-desc'>Mais Recentes</SelectItem>
                          <SelectItem value='created_at-asc'>Mais Antigos</SelectItem>
                          <SelectItem value='status-asc'>Status</SelectItem>
                          <SelectItem value='athletic-asc'>Atlética</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Results Summary */}
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center space-x-2'>
                      <TrendingUp className='h-4 w-4 text-blue-600' />
                      <span className='font-medium text-blue-900'>
                        {filteredAndSortedAthletes.length} atleta{filteredAndSortedAthletes.length !== 1 ? 's' : ''}{' '}
                        encontrado{filteredAndSortedAthletes.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {hasActiveFilters && (
                      <div className='flex items-center space-x-2'>
                        <Sparkles className='h-4 w-4 text-blue-600' />
                        <span className='text-sm text-blue-700 font-medium'>Filtros ativos</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Athletes List */}
            {filteredAndSortedAthletes.length === 0 ? (
              <EmptyState userRole={userRole} />
            ) : (
              <div className='space-y-4'>
                {filteredAndSortedAthletes.map((athlete) => (
                  <AthleteListItem
                    key={athlete.id}
                    athlete={athlete}
                    userRole={userRole}
                    onViewDocument={handleViewDocument}
                    onApprove={handleApproveAthlete}
                    onReject={handleRejectAthlete}
                    onWhatsApp={handleWhatsApp}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue={isUserAthlete ? 'list' : 'register'} className='w-full'>
            <TabsList className='grid w-full grid-cols-2 h-12 bg-white border border-gray-200'>
              <TabsTrigger value='list' className='h-10 font-medium'>
                Meus Dados de Atleta
              </TabsTrigger>
              {!isUserAthlete && (
                <TabsTrigger value='register' className='h-10 font-medium'>
                  Cadastrar como Atleta
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value='list' className='mt-6'>
              {isUserAthlete ? (
                <div className='space-y-4'>
                  {filteredAndSortedAthletes.map((athlete) => (
                    <AthleteListItem
                      key={athlete.id}
                      athlete={athlete}
                      userRole={userRole}
                      onViewDocument={handleViewDocument}
                      onApprove={handleApproveAthlete}
                      onReject={handleRejectAthlete}
                      onWhatsApp={handleWhatsApp}
                    />
                  ))}
                </div>
              ) : (
                <div className='text-center py-20'>
                  <AlertCircle className='h-16 w-16 text-gray-400 mx-auto mb-6' />
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Você ainda não é um atleta registrado</h3>
                  <p className='text-gray-600'>Cadastre-se para participar das competições!</p>
                </div>
              )}
            </TabsContent>
            {!isUserAthlete && (
              <TabsContent value='register' className='mt-6'>
                <div className='text-center py-20'>
                  <Star className='h-16 w-16 text-gray-400 mx-auto mb-6' />
                  <h3 className='text-xl font-semibold text-gray-900 mb-2'>Cadastro de Atleta</h3>
                  <p className='text-gray-600'>Formulário de cadastro será implementado aqui.</p>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}

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
      </div>
    </div>
  )
}
