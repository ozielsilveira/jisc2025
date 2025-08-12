'use client'

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle,
  Clock,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Trophy,
  Gamepad2,
  Users,
  Zap,
  Target,
  Heart,
  ExternalLink,
  type File,
  Eye,
  FileCheck,
  Sparkles,
  RefreshCw,
  X,
  Check
} from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { uploadFileToR2 } from '@/actions/upload'

type UserProfile = {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  gender: string
  role: string
}

type Sport = {
  id: string
  name: string
  type: 'sport' | 'boteco'
}

type Athlete = {
  id: string
  user_id: string
  enrollment_document_url: string
  cnh_cpf_document_url: string
  status: 'pending' | 'sent' | 'approved' | 'rejected'
}

// Definir o limite de tamanho de arquivo para validação no cliente
const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// Utility function to truncate URLs for display
const truncateUrl = (url: string, maxLength = 50): string => {
  if (url.length <= maxLength) return url
  const start = url.substring(0, 20)
  const end = url.substring(url.length - 20)
  return `${start}...${end}`
}

// Component to display uploaded file with replacement functionality
const UploadedFileDisplay = ({
  url,
  label,
  onReplace,
  isReplacing,
  canReplace = true,
  fileType
}: {
  url: string
  label: string
  onReplace?: () => void
  isReplacing?: boolean
  canReplace?: boolean
  fileType?: 'document' | 'enrollment'
}) => {
  const fileName = url.split('/').pop() || 'arquivo'
  const truncatedUrl = truncateUrl(url)

  return (
    <div className='bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm w-full'>
      <div className='flex flex-col space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-4'>
        <div className='flex-shrink-0 self-center sm:self-start'>
          <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg'>
            <CheckCircle className='h-5 w-5 sm:h-6 sm:w-6 text-white' />
          </div>
        </div>
        <div className='flex-1 min-w-0 space-y-3'>
          <div className='space-y-3'>
            <div className='min-w-0'>
              <div className='flex items-center space-x-2 mb-2'>
                <FileCheck className='h-4 w-4 text-green-600 flex-shrink-0' />
                <p className='text-sm sm:text-base font-bold text-green-800 leading-tight'>
                  {label} enviado com sucesso!
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-xs sm:text-sm text-green-600 break-all'>{fileName}</p>
                <p className='text-xs text-green-500 hidden sm:block'>{truncatedUrl}</p>
              </div>
            </div>

            {/* Action buttons - Stack on mobile, inline on desktop */}
            <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:items-center'>
              <a
                href={url}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center space-x-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 rounded-lg transition-colors text-sm font-medium border border-green-300 hover:border-green-400 w-full sm:w-auto'
              >
                <Eye className='h-4 w-4 flex-shrink-0' />
                <span>Visualizar</span>
                <ExternalLink className='h-3 w-3 flex-shrink-0' />
              </a>
              {canReplace && onReplace && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={onReplace}
                  disabled={isReplacing}
                  className='inline-flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-300 hover:border-blue-400 transition-colors w-full sm:w-auto'
                >
                  {isReplacing ? (
                    <Loader2 className='h-4 w-4 animate-spin flex-shrink-0' />
                  ) : (
                    <RefreshCw className='h-4 w-4 flex-shrink-0' />
                  )}
                  <span>{isReplacing ? 'Substituindo...' : 'Substituir'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Success indicator */}
          <div className='bg-white bg-opacity-60 rounded-lg p-2 sm:p-3 border border-green-200'>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0'></div>
              <span className='text-xs sm:text-sm text-green-700 font-medium'>
                Arquivo carregado e pronto para análise
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component for file replacement interface
const FileReplacementInterface = ({
  label,
  description,
  onFileChange,
  onCancel,
  onConfirm,
  selectedFile,
  isUploading,
  fileType
}: {
  label: string
  description: string
  onFileChange: (file: File | null) => void
  onCancel: () => void
  onConfirm: () => void
  selectedFile: File | null
  isUploading: boolean
  fileType: 'document' | 'enrollment'
}) => {
  return (
    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4 lg:p-5 shadow-sm w-full'>
      <div className='space-y-4'>
        <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3'>
          <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 self-center sm:self-start'>
            <RefreshCw className='h-5 w-5 text-white' />
          </div>
          <div className='text-center sm:text-left'>
            <h4 className='text-base sm:text-lg font-bold text-blue-800'>Substituir {label}</h4>
            <p className='text-xs sm:text-sm text-blue-600 mt-1'>Selecione um novo arquivo para substituir o atual</p>
          </div>
        </div>

        <div className='bg-white bg-opacity-70 rounded-lg p-3 sm:p-4 border border-blue-200'>
          <FileUpload
            id={`replace-${fileType}`}
            label={label}
            description={description}
            onFileChange={onFileChange}
            required={true}
          />
        </div>

        {selectedFile && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
            <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2'>
              <Check className='h-4 w-4 text-green-600 flex-shrink-0 self-center sm:self-start' />
              <div className='min-w-0 text-center sm:text-left'>
                <span className='text-sm font-medium text-green-700 break-all'>Novo arquivo: {selectedFile.name}</span>
                <p className='text-xs text-green-600 mt-1'>
                  Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isUploading}
            className='w-full sm:flex-1 bg-transparent order-2 sm:order-1'
          >
            <X className='h-4 w-4 mr-2 flex-shrink-0' />
            Cancelar
          </Button>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={!selectedFile || isUploading}
            className='w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2'
          >
            {isUploading ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin flex-shrink-0' />
                Enviando...
              </>
            ) : (
              <>
                <Upload className='h-4 w-4 mr-2 flex-shrink-0' />
                Confirmar Substituição
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [athleteStatus, setAthleteStatus] = useState<'pending' | 'sent' | 'approved' | 'rejected' | null>(null)

  // File replacement state - optimized for real-time updates
  const [isReplacingDocument, setIsReplacingDocument] = useState(false)
  const [isReplacingEnrollment, setIsReplacingEnrollment] = useState(false)
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null)
  const [newEnrollmentFile, setNewEnrollmentFile] = useState<File | null>(null)
  const [isUploadingReplacement, setIsUploadingReplacement] = useState(false)

  // Real-time upload progress state
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'idle' | 'uploading' | 'success' | 'error' }>({})

  // Athlete registration state
  const [sports, setSports] = useState<Sport[]>([])
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUploadStep, setCurrentUploadStep] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const [isPageVisible, setIsPageVisible] = useState(true)
  const [hasUnsavedFiles, setHasUnsavedFiles] = useState(false)
  const progressIntervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({})

  const persistFiles = useCallback(() => {
    if (typeof window === 'undefined') return

    const filesToPersist = {
      documentFile: documentFile
        ? {
            name: documentFile.name,
            size: documentFile.size,
            type: documentFile.type,
            lastModified: documentFile.lastModified
          }
        : null,
      enrollmentFile: enrollmentFile
        ? {
            name: enrollmentFile.name,
            size: enrollmentFile.size,
            type: enrollmentFile.type,
            lastModified: enrollmentFile.lastModified
          }
        : null,
      newDocumentFile: newDocumentFile
        ? {
            name: newDocumentFile.name,
            size: newDocumentFile.size,
            type: newDocumentFile.type,
            lastModified: newDocumentFile.lastModified
          }
        : null,
      newEnrollmentFile: newEnrollmentFile
        ? {
            name: newEnrollmentFile.name,
            size: newEnrollmentFile.size,
            type: newEnrollmentFile.type,
            lastModified: newEnrollmentFile.lastModified
          }
        : null,
      selectedSports,
      agreedToTerms,
      isReplacingDocument,
      isReplacingEnrollment,
      uploadProgress,
      uploadStatus
    }

    sessionStorage.setItem('profile-form-state', JSON.stringify(filesToPersist))
  }, [
    documentFile,
    enrollmentFile,
    newDocumentFile,
    newEnrollmentFile,
    selectedSports,
    agreedToTerms,
    isReplacingDocument,
    isReplacingEnrollment,
    uploadProgress,
    uploadStatus
  ])

  const restoreFiles = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const savedState = sessionStorage.getItem('profile-form-state')
      if (savedState) {
        const parsed = JSON.parse(savedState)

        // Restore form state
        setSelectedSports(parsed.selectedSports || [])
        setAgreedToTerms(parsed.agreedToTerms || false)
        setIsReplacingDocument(parsed.isReplacingDocument || false)
        setIsReplacingEnrollment(parsed.isReplacingEnrollment || false)
        setUploadProgress(parsed.uploadProgress || {})
        setUploadStatus(parsed.uploadStatus || {})

        // Show recovery message if there were files
        if (parsed.documentFile || parsed.enrollmentFile || parsed.newDocumentFile || parsed.newEnrollmentFile) {
          toast({
            title: 'Sessão restaurada',
            description: 'Seus arquivos foram recuperados. Por favor, selecione-os novamente para continuar.',
            variant: 'default'
          })
          setHasUnsavedFiles(true)
        }
      }
    } catch (error) {
      console.error('Error restoring files:', error)
    }
  }, [toast])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)

      if (!isVisible) {
        // Page is becoming hidden - persist current state
        persistFiles()
      } else {
        // Page is becoming visible - check if we need to restore state
        if (!hasUnsavedFiles) {
          restoreFiles()
        }
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedFiles || documentFile || enrollmentFile || newDocumentFile || newEnrollmentFile) {
        persistFiles()
        e.preventDefault()
        e.returnValue = 'Você tem arquivos não salvos. Tem certeza que deseja sair?'
        return e.returnValue
      }
    }

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from cache
        restoreFiles()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pageshow', handlePageShow)

      // Clean up any running intervals
      Object.values(progressIntervalsRef.current).forEach((interval) => {
        clearInterval(interval)
      })
    }
  }, [persistFiles, restoreFiles, hasUnsavedFiles, documentFile, enrollmentFile, newDocumentFile, newEnrollmentFile])

  const fetchProfileAndSports = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (userError) throw userError
      setProfile(userData as UserProfile)

      if (userData.role === 'athlete') {
        await fetchSports()
        const { data: athleteData, error: athleteError } = await supabase
          .from('athletes')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (athleteError && athleteError.code !== 'PGRST116') {
          throw athleteError
        }

        if (athleteData) {
          setAthlete(athleteData)
          setAthleteStatus(athleteData.status)
          const { data: athleteSportsData, error: athleteSportsError } = await supabase
            .from('athlete_sports')
            .select('sport_id')
            .eq('athlete_id', athleteData.id)

          if (athleteSportsError) {
            console.error('Error fetching athlete sports:', athleteSportsError)
            toast({
              title: 'Erro ao carregar modalidades do atleta',
              description: 'Não foi possível carregar suas modalidades selecionadas.',
              variant: 'destructive'
            })
          } else if (athleteSportsData) {
            setSelectedSports(athleteSportsData.map((as) => as.sport_id))
          }
        } else {
          setAthleteStatus(null)
        }
      }
    } catch (error) {
      console.error('Error fetching profile or sports:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar seu perfil ou modalidades.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, toast])

  useEffect(() => {
    fetchProfileAndSports()
  }, [fetchProfileAndSports])

  useEffect(() => {
    restoreFiles()
  }, [restoreFiles])

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase.from('sports').select('*')
      if (error) throw error
      setSports(data)
    } catch (error) {
      console.error('Error fetching sports:', error)
      toast({
        title: 'Erro ao carregar modalidades',
        description: 'Não foi possível carregar a lista de modalidades.',
        variant: 'destructive'
      })
    }
  }

  // File replacement handlers
  const handleReplaceDocument = () => {
    setIsReplacingDocument(true)
    setNewDocumentFile(null)
  }

  const handleReplaceEnrollment = () => {
    setIsReplacingEnrollment(true)
    setNewEnrollmentFile(null)
  }

  const handleCancelReplacement = (type: 'document' | 'enrollment') => {
    if (type === 'document') {
      setIsReplacingDocument(false)
      setNewDocumentFile(null)
    } else {
      setIsReplacingEnrollment(false)
      setNewEnrollmentFile(null)
    }
  }

  const handleFileReplacement = async (file: File, type: 'document' | 'enrollment') => {
    if (!user || !athlete) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive'
      })
      return
    }

    const uploadKey = `${type}-replacement`
    setIsUploadingReplacement(true)
    setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'uploading' }))
    setUploadProgress((prev) => ({ ...prev, [uploadKey]: 0 }))

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [uploadKey]: Math.min((prev[uploadKey] || 0) + 10, 90)
        }))
      }, 200)

      progressIntervalsRef.current[uploadKey] = progressInterval

      const formData = new FormData()
      formData.append('file', file)

      const currentUrl = type === 'document' ? athlete.cnh_cpf_document_url : athlete.enrollment_document_url
      const uploadResult = await uploadFileToR2(formData, user.id, type, currentUrl)

      clearInterval(progressInterval)
      delete progressIntervalsRef.current[uploadKey]

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Erro ao fazer upload do arquivo.')
      }

      setUploadProgress((prev) => ({ ...prev, [uploadKey]: 100 }))

      // Optimistic update - update UI immediately
      let updateData: Partial<Athlete> = {}

      if (type === 'document') {
        updateData.cnh_cpf_document_url = uploadResult.url
      } else {
        updateData.enrollment_document_url = uploadResult.url
      }
      const { data: updatedAthlete, error: updateError } = await supabase
        .from('athletes')
        .update(updateData)
        .eq('id', athlete.id)
        .select()
        .single()

      if (updateError) {
        // Revert optimistic update on error
        setAthlete(athlete)
        throw updateError
      }

      // Confirm the update with server data
      setAthlete(updatedAthlete)

      // Reset replacement state
      if (type === 'document') {
        setIsReplacingDocument(false)
        setNewDocumentFile(null)
      } else {
        setIsReplacingEnrollment(false)
        setNewEnrollmentFile(null)
      }

      setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'success' }))
      setHasUnsavedFiles(false)

      sessionStorage.removeItem('profile-form-state')

      toast({
        title: 'Arquivo substituído com sucesso!',
        description: `${type === 'document' ? 'Documento' : 'Atestado de matrícula'} foi atualizado.`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Error replacing file:', error)
      setUploadStatus((prev) => ({ ...prev, [uploadKey]: 'error' }))
      toast({
        title: 'Erro ao substituir arquivo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      })
    } finally {
      setIsUploadingReplacement(false)
      // Clean up interval if it exists
      if (progressIntervalsRef.current[uploadKey]) {
        clearInterval(progressIntervalsRef.current[uploadKey])
        delete progressIntervalsRef.current[uploadKey]
      }
    }
  }

  const handleDocumentFileChange = useCallback(
    (file: File | null) => {
      setDocumentFile(file)
      setHasUnsavedFiles(!!file)
      persistFiles()
    },
    [persistFiles]
  )

  const handleEnrollmentFileChange = useCallback(
    (file: File | null) => {
      setEnrollmentFile(file)
      setHasUnsavedFiles(!!file)
      persistFiles()
    },
    [persistFiles]
  )

  // Validação de tamanho de arquivo no cliente para feedback imediato
  const handleEnrollmentChange = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'Arquivo muito grande',
        description: `O atestado excede o limite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive'
      })
      setEnrollmentFile(null)
      return
    }
    handleEnrollmentFileChange(file)
  }

  const handleDocumentChange = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'Arquivo muito grande',
        description: `O documento excede o limite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive'
      })
      setDocumentFile(null)
      return
    }
    handleDocumentFileChange(file)
  }

  const handleNewDocumentChange = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'Arquivo muito grande',
        description: `O documento excede o limite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive'
      })
      setNewDocumentFile(null)
      return
    }
    setNewDocumentFile(file)
  }

  const handleNewEnrollmentChange = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: 'Arquivo muito grande',
        description: `O atestado excede o limite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: 'destructive'
      })
      setNewEnrollmentFile(null)
      return
    }
    setNewEnrollmentFile(file)
  }

  const handleSportToggle = (sportId: string) => {
    setSelectedSports((prev) => {
      const newSelection = prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
      return newSelection
    })
  }

  const handleAthleteRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const hasValidationErrors =
      (!documentFile && !athlete?.cnh_cpf_document_url) ||
      (!enrollmentFile && !athlete?.enrollment_document_url) ||
      selectedSports.length === 0 ||
      !agreedToTerms

    if (hasValidationErrors) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos do formulário e aceite os termos antes de enviar.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress((prev) => ({ ...prev, registration: 0 }))
    setUploadStatus((prev) => ({ ...prev, registration: 'uploading' }))

    try {
      setCurrentUploadStep('Preparando documentos...')
      setUploadProgress((prev) => ({ ...prev, registration: 10 }))

      let documentUrl = athlete?.cnh_cpf_document_url
      if (documentFile) {
        setCurrentUploadStep('Enviando documento...')
        const formDataDoc = new FormData()
        formDataDoc.append('file', documentFile)
        const uploadResult = await uploadFileToR2(formDataDoc, user.id, 'document', athlete?.cnh_cpf_document_url)
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Erro ao fazer upload do documento.')
        }
        documentUrl = uploadResult.url
        setUploadProgress((prev) => ({ ...prev, registration: 40 }))
      }

      let enrollmentUrl = athlete?.enrollment_document_url
      if (enrollmentFile) {
        setCurrentUploadStep('Enviando atestado de matrícula...')
        const formDataEnroll = new FormData()
        formDataEnroll.append('file', enrollmentFile)
        const uploadResult = await uploadFileToR2(
          formDataEnroll,
          user.id,
          'enrollment',
          athlete?.enrollment_document_url
        )
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Erro ao fazer upload do atestado.')
        }
        enrollmentUrl = uploadResult.url
        setUploadProgress((prev) => ({ ...prev, registration: 60 }))
      }

      setCurrentUploadStep('Finalizando cadastro...')
      setUploadProgress((prev) => ({ ...prev, registration: 80 }))

      if (athlete) {
        const { data: updatedAthlete, error: updateError } = await supabase
          .from('athletes')
          .update({
            cnh_cpf_document_url: documentUrl,
            enrollment_document_url: enrollmentUrl,
            status: 'sent'
          })
          .eq('id', athlete.id)
          .select()
          .single()

        if (updateError) throw updateError

        // Real-time UI update
        setAthlete(updatedAthlete)
        setAthleteStatus('sent')

        const { error: deleteSportsError } = await supabase.from('athlete_sports').delete().eq('athlete_id', athlete.id)
        if (deleteSportsError) throw deleteSportsError

        const athleteSports = selectedSports.map((sportId) => ({
          athlete_id: athlete.id,
          sport_id: sportId
        }))

        const { error: insertSportsError } = await supabase.from('athlete_sports').insert(athleteSports)
        if (insertSportsError) throw insertSportsError
      } else {
        const { data: newAthlete, error: insertError } = await supabase
          .from('athletes')
          .insert({
            user_id: user.id,
            cnh_cpf_document_url: documentUrl!,
            enrollment_document_url: enrollmentUrl!,
            status: 'sent'
          })
          .select()
          .single()

        if (insertError) throw insertError

        const athleteSports = selectedSports.map((sportId) => ({
          athlete_id: newAthlete.id,
          sport_id: sportId
        }))

        const { error: sportsError } = await supabase.from('athlete_sports').insert(athleteSports)
        if (sportsError) throw sportsError

        // Real-time UI update
        setAthlete(newAthlete)
        setAthleteStatus('sent')
      }

      setUploadProgress((prev) => ({ ...prev, registration: 100 }))
      setCurrentUploadStep('Concluído!')
      setUploadStatus((prev) => ({ ...prev, registration: 'success' }))

      toast({
        title: 'Cadastro enviado com sucesso!',
        description: 'Seu cadastro de atleta foi enviado e está aguardando aprovação.',
        variant: 'success'
      })

      // Clear files after successful submission
      setDocumentFile(null)
      setEnrollmentFile(null)
    } catch (error: any) {
      console.error('Error during athlete registration:', error)
      setUploadStatus((prev) => ({ ...prev, registration: 'error' }))
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível concluir o seu cadastro de atleta. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, registration: 0 }))
        setCurrentUploadStep('')
        setUploadStatus((prev) => ({ ...prev, registration: 'idle' }))
      }, 3000)
    }
  }

  const getSportIcon = (sportName: string, sportType: 'sport' | 'boteco') => {
    if (sportType === 'boteco') {
      return Gamepad2
    }
    const sportIcons: { [key: string]: any } = {
      futebol: Trophy,
      basquete: Target,
      volei: Users,
      tenis: Zap,
      natacao: Heart
    }
    const normalizedName = sportName.toLowerCase()
    return sportIcons[normalizedName] || Trophy
  }

  const getSportColors = (sportType: 'sport' | 'boteco', isSelected: boolean) => {
    if (sportType === 'sport') {
      return isSelected
        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25'
        : 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300'
    } else {
      return isSelected
        ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/25'
        : 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300'
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex flex-col items-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin text-[#0456FC]' />
          <p className='text-sm text-gray-500'>Carregando perfil...</p>
        </div>
      </div>
    )
  }

  const StatusCard = ({
    status,
    title,
    description,
    icon: Icon,
    iconColor
  }: {
    status: string
    title: string
    description: string
    icon: any
    iconColor: string
  }) => (
    <Card className='border-l-4 border-l-current w-full'>
      <CardContent className='pt-6'>
        <div className='flex flex-col space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-4'>
          <div className={`p-3 rounded-full ${iconColor} bg-opacity-10 flex-shrink-0 self-center sm:self-start`}>
            <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${iconColor}`} />
          </div>
          <div className='flex-1 space-y-2 min-w-0 text-center sm:text-left'>
            <h3 className='text-base sm:text-lg lg:text-xl font-bold'>{title}</h3>
            <p className='text-gray-600 text-sm sm:text-base'>{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const QuickSportsSelector = () => {
    const sportsData = sports.filter((sport) => sport.type === 'sport')
    const botecoData = sports.filter((sport) => sport.type === 'boteco')

    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0'>
              3
            </div>
            <h3 className='text-base sm:text-lg lg:text-xl font-semibold'>Modalidades de Interesse</h3>
          </div>
        </div>
        <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 lg:p-6 space-y-6'>
          <p className='text-xs sm:text-sm lg:text-base text-gray-600 text-center'>
            Selecione as modalidades que você gostaria de participar. Toque nos cartões para selecioná-las!
          </p>

          {/* Sports Section */}
          {sportsData.length > 0 && (
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Trophy className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0' />
                <h4 className='font-semibold text-blue-800 text-sm sm:text-base'>Esportes</h4>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4'>
                {sportsData.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id)
                  const Icon = getSportIcon(sport.name, sport.type)
                  const colors = getSportColors(sport.type, isSelected)

                  return (
                    <button
                      key={sport.id}
                      onClick={() => handleSportToggle(sport.id)}
                      className={`
                        relative p-3 sm:p-4 lg:p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
                        ${colors}
                        ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-30' : ''}
                      `}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className='absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg'>
                          <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-white' />
                        </div>
                      )}
                      <div className='flex flex-col items-center space-y-1 sm:space-y-2 lg:space-y-3'>
                        <div
                          className={`p-1.5 sm:p-2 lg:p-3 rounded-lg ${
                            isSelected ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-50'
                          }`}
                        >
                          <Icon className='h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8' />
                        </div>
                        <span className='font-medium text-xs sm:text-sm text-center leading-tight break-words'>
                          {sport.name}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Boteco Section */}
          {botecoData.length > 0 && (
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Gamepad2 className='h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0' />
                <h4 className='font-semibold text-purple-800 text-sm sm:text-base'>Jogos de Boteco</h4>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4'>
                {botecoData.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id)
                  const Icon = getSportIcon(sport.name, sport.type)
                  const colors = getSportColors(sport.type, isSelected)

                  return (
                    <button
                      key={sport.id}
                      onClick={() => handleSportToggle(sport.id)}
                      className={`
                        relative p-3 sm:p-4 lg:p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
                        ${colors}
                        ${isSelected ? 'ring-4 ring-purple-500 ring-opacity-30' : ''}
                      `}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className='absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg'>
                          <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 text-white' />
                        </div>
                      )}
                      <div className='flex flex-col items-center space-y-1 sm:space-y-2 lg:space-y-3'>
                        <div
                          className={`p-1.5 sm:p-2 lg:p-3 rounded-lg ${
                            isSelected ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-50'
                          }`}
                        >
                          <Icon className='h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8' />
                        </div>
                        <span className='font-medium text-xs sm:text-sm text-center leading-tight break-words'>
                          {sport.name}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {sports.length > 0 && (
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setSelectedSports(sports.map((s) => s.id))}
                className='flex-1 text-xs sm:text-sm'
                disabled={selectedSports.length === sports.length}
              >
                Selecionar Todas
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => setSelectedSports([])}
                className='flex-1 text-xs sm:text-sm'
                disabled={selectedSports.length === 0}
              >
                Limpar Seleção
              </Button>
            </div>
          )}

          {/* Validation Message */}
          {selectedSports.length === 0 && (
            <div className='bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4'>
              <div className='flex items-center space-x-3'>
                <AlertCircle className='h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0' />
                <p className='text-xs sm:text-sm text-red-600 font-medium'>
                  Selecione pelo menos uma modalidade para continuar
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {selectedSports.length > 0 && (
            <div className='bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4'>
              <div className='flex items-center space-x-3'>
                <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0' />
                <p className='text-xs sm:text-sm text-green-600 font-medium'>
                  Perfeito! Você selecionou {selectedSports.length} modalidade{selectedSports.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-0'>
        {/* Header */}
        <div className='space-y-2 px-1 sm:px-0'>
          <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900'>Meu Perfil</h1>
          <p className='text-sm sm:text-base lg:text-lg text-gray-600'>Visualize e edite suas informações pessoais.</p>
        </div>

        {profile?.role === 'athlete' && (
          <Tabs defaultValue='register' className='w-full'>
            <TabsContent value='register' className='space-y-4 sm:space-y-6'>
              {/* Status Cards */}
              {athleteStatus === 'approved' && (
                <div className='px-1 sm:px-0'>
                  <StatusCard
                    status='approved'
                    title='Documentos Aprovados'
                    description='Seus documentos foram aprovados. Bem-vindo ao time!'
                    icon={CheckCircle}
                    iconColor='text-green-500'
                  />
                </div>
              )}

              {athleteStatus === 'sent' && (
                <div className='px-1 sm:px-0'>
                  <StatusCard
                    status='pending'
                    title='Documentos em Análise'
                    description='Seus documentos foram enviados e estão em análise. Avisaremos quando o processo for concluído.'
                    icon={Clock}
                    iconColor='text-yellow-500'
                  />
                </div>
              )}

              {/* Registration Form */}
              {(athleteStatus === 'rejected' || athleteStatus === null || athleteStatus === 'pending') && (
                <div className='px-1 sm:px-0'>
                  <Card className='shadow-lg w-full overflow-hidden'>
                    <CardHeader className='space-y-4 p-4 sm:p-6'>
                      <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3'>
                        <div className='p-2 bg-[#0456FC] bg-opacity-10 rounded-lg flex-shrink-0 self-center sm:self-start'>
                          <FileText className='h-5 w-5 sm:h-6 sm:w-6 text-[#0456FC]' />
                        </div>
                        <div className='min-w-0 text-center sm:text-left'>
                          <CardTitle className='text-lg sm:text-xl lg:text-2xl'>Cadastro de Atleta</CardTitle>
                          <CardDescription className='text-sm sm:text-base lg:text-lg mt-1'>
                            Complete seu cadastro enviando os documentos necessários
                          </CardDescription>
                        </div>
                      </div>

                      {athleteStatus === 'rejected' && (
                        <div className='bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4'>
                          <div className='flex flex-col space-y-3 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-3'>
                            <AlertCircle className='h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 self-center sm:self-start sm:mt-0.5' />
                            <div className='min-w-0 text-center sm:text-left'>
                              <h4 className='font-medium text-red-800 text-sm sm:text-base'>Cadastro rejeitado</h4>
                              <p className='text-xs sm:text-sm text-red-700 mt-1'>
                                Seu cadastro foi rejeitado. Por favor, verifique os arquivos e envie-os novamente.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className='space-y-6 sm:space-y-8 p-4 sm:p-6'>
                      <form onSubmit={handleAthleteRegistration} className='space-y-6 sm:space-y-8'>
                        {isSubmitting && (
                          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-3'>
                            <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3'>
                              <Loader2 className='h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-spin flex-shrink-0 self-center sm:self-start' />
                              <span className='font-medium text-blue-800 text-sm sm:text-base text-center sm:text-left'>
                                {currentUploadStep}
                              </span>
                            </div>
                            <Progress value={uploadProgress['registration'] || 0} className='w-full' />
                            <p className='text-xs sm:text-sm text-blue-600 text-center sm:text-left'>
                              {uploadProgress['registration'] || 0}% concluído - Não feche esta página
                            </p>
                          </div>
                        )}

                        {Object.entries(uploadStatus).map(
                          ([key, status]) =>
                            status === 'success' && (
                              <div
                                key={key}
                                className='bg-green-50 border border-green-200 rounded-lg p-3 animate-in fade-in-50'
                              >
                                <div className='flex items-center space-x-2'>
                                  <CheckCircle className='h-4 w-4 text-green-500' />
                                  <span className='text-sm text-green-700 font-medium'>
                                    Upload concluído com sucesso!
                                  </span>
                                </div>
                              </div>
                            )
                        )}

                        {/* File Uploads */}
                        <div className='space-y-6 sm:space-y-8'>
                          <div className='space-y-4'>
                            <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3'>
                              <div className='w-8 h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 self-center sm:self-start'>
                                1
                              </div>
                              <h3 className='text-base sm:text-lg lg:text-xl font-semibold text-center sm:text-left'>
                                Documento com Foto
                              </h3>
                              {athlete?.cnh_cpf_document_url && (
                                <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium self-center sm:self-start'>
                                  <CheckCircle className='h-3 w-3 flex-shrink-0' />
                                  <span>Enviado</span>
                                </div>
                              )}
                            </div>

                            {athlete?.cnh_cpf_document_url && !isReplacingDocument ? (
                              <UploadedFileDisplay
                                url={athlete.cnh_cpf_document_url}
                                label='Documento com foto'
                                onReplace={handleReplaceDocument}
                                canReplace={
                                  athleteStatus === 'pending' || athleteStatus === 'rejected' || athleteStatus === null
                                }
                                fileType='document'
                              />
                            ) : isReplacingDocument ? (
                              <FileReplacementInterface
                                label='documento com foto'
                                description='Envie uma foto clara do seu documento de identidade (frente e verso se necessário)'
                                onFileChange={handleNewDocumentChange}
                                onCancel={() => handleCancelReplacement('document')}
                                onConfirm={() => handleFileReplacement(newDocumentFile!, 'document')}
                                selectedFile={newDocumentFile}
                                isUploading={isUploadingReplacement}
                                fileType='document'
                              />
                            ) : (
                              <div className='border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 w-full'>
                                <div className='flex items-center space-x-2 mb-2'>
                                  <AlertCircle className='h-4 w-4 text-amber-500 flex-shrink-0' />
                                  <span className='text-sm font-medium text-amber-700'>Documento pendente</span>
                                </div>
                                <FileUpload
                                  id='document'
                                  label='CNH ou RG com foto'
                                  description='Envie uma foto clara do seu documento de identidade (frente e verso se necessário)'
                                  existingFileUrl={athlete?.cnh_cpf_document_url}
                                  onFileChange={handleDocumentChange}
                                  required={!athlete?.cnh_cpf_document_url}
                                />
                              </div>
                            )}
                          </div>

                          <div className='space-y-4'>
                            <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3'>
                              <div className='w-8 h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 self-center sm:self-start'>
                                2
                              </div>
                              <h3 className='text-base sm:text-lg lg:text-xl font-semibold text-center sm:text-left'>
                                Atestado de Matrícula
                              </h3>
                              {athlete?.enrollment_document_url && (
                                <div className='flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium self-center sm:self-start'>
                                  <CheckCircle className='h-3 w-3 flex-shrink-0' />
                                  <span>Enviado</span>
                                </div>
                              )}
                            </div>

                            {athlete?.enrollment_document_url && !isReplacingEnrollment ? (
                              <UploadedFileDisplay
                                url={athlete.enrollment_document_url}
                                label='Atestado de matrícula'
                                onReplace={handleReplaceEnrollment}
                                canReplace={
                                  athleteStatus === 'pending' || athleteStatus === 'rejected' || athleteStatus === null
                                }
                                fileType='enrollment'
                              />
                            ) : isReplacingEnrollment ? (
                              <FileReplacementInterface
                                label='atestado de matrícula'
                                description='O atestado deve ser recente e comprovar sua matrícula na instituição de ensino'
                                onFileChange={handleNewEnrollmentChange}
                                onCancel={() => handleCancelReplacement('enrollment')}
                                onConfirm={() => handleFileReplacement(newEnrollmentFile!, 'enrollment')}
                                selectedFile={newEnrollmentFile}
                                isUploading={isUploadingReplacement}
                                fileType='enrollment'
                              />
                            ) : (
                              <div className='border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 w-full'>
                                <div className='flex items-center space-x-2 mb-2'>
                                  <AlertCircle className='h-4 w-4 text-amber-500 flex-shrink-0' />
                                  <span className='text-sm font-medium text-amber-700'>Atestado pendente</span>
                                </div>
                                <FileUpload
                                  id='enrollment'
                                  label='Comprovante de matrícula atual'
                                  description='O atestado deve ser recente e comprovar sua matrícula na instituição de ensino'
                                  existingFileUrl={athlete?.enrollment_document_url}
                                  onFileChange={handleEnrollmentChange}
                                  required={!athlete?.enrollment_document_url}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Sports Selection */}
                        <QuickSportsSelector />

                        {/* Consent Checkbox */}
                        <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4'>
                          <div className='flex flex-col space-y-3 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-3'>
                            <Checkbox
                              id='terms'
                              checked={agreedToTerms}
                              onCheckedChange={(checked) => {
                                console.log('Checkbox changed:', checked) // Debug log
                                setAgreedToTerms(checked === true)
                              }}
                              className='mt-1 h-5 w-5 border-2 border-gray-400 data-[state=checked]:bg-[#0456FC] data-[state=checked]:border-[#0456FC] focus:ring-2 focus:ring-[#0456FC] focus:ring-offset-2 flex-shrink-0 self-center sm:self-start'
                            />
                            <Label
                              htmlFor='terms'
                              className='text-sm sm:text-base text-gray-800 leading-relaxed cursor-pointer flex-1 text-center sm:text-left'
                            >
                              Eu li e concordo com os{' '}
                              <a
                                href='#'
                                className='text-[#0456FC] hover:underline font-medium'
                                onClick={(e) => e.preventDefault()}
                              >
                                Termos de Uso e Política de Privacidade
                              </a>
                              , incluindo o compartilhamento dos meus direitos de imagem e dados legais para fins de
                              registro e participação em eventos.
                            </Label>
                          </div>
                          {/* Visual feedback for checkbox state */}
                          <div
                            className={`transition-all duration-200 rounded-lg p-3 border-2 ${
                              agreedToTerms ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2'>
                              {agreedToTerms ? (
                                <>
                                  <CheckCircle className='h-4 w-4 text-green-600 flex-shrink-0 self-center sm:self-start' />
                                  <p className='text-sm text-green-700 font-medium text-center sm:text-left'>
                                    ✅ Termos aceitos - Você pode prosseguir com o cadastro
                                  </p>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className='h-4 w-4 text-red-500 flex-shrink-0 self-center sm:self-start' />
                                  <p className='text-sm text-red-600 font-medium text-center sm:text-left'>
                                    ⚠️ Você deve concordar com os termos para prosseguir
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className='pt-4'>
                          <Button
                            type='submit'
                            className='w-full bg-gradient-to-r from-[#0456FC] to-[#0345D1] hover:from-[#0345D1] hover:to-[#0234B8] text-white font-bold py-3 sm:py-4 text-sm sm:text-base lg:text-lg transition-all duration-200 disabled:opacity-50 shadow-lg'
                            disabled={
                              isSubmitting ||
                              isUploadingReplacement ||
                              (!documentFile && !athlete?.cnh_cpf_document_url) ||
                              (!enrollmentFile && !athlete?.enrollment_document_url) ||
                              selectedSports.length === 0 ||
                              !agreedToTerms
                            }
                          >
                            {isSubmitting ? (
                              <div className='flex items-center justify-center space-x-2'>
                                <Loader2 className='h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0' />
                                <span>Enviando...</span>
                              </div>
                            ) : (
                              <div className='flex items-center justify-center space-x-2'>
                                <Upload className='h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0' />
                                <span>Enviar e Finalizar Cadastro</span>
                              </div>
                            )}
                          </Button>
                          <p className='text-xs text-gray-500 text-center mt-2 sm:mt-3'>
                            Ao enviar, você concorda que as informações fornecidas são verdadeiras
                          </p>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
