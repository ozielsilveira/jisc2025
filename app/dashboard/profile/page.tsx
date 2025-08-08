'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, Clock, Upload, FileText, AlertCircle, Loader2, Trophy, Gamepad2, Users, Zap, Target, Heart } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox' // Import Checkbox

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

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [athleteStatus, setAthleteStatus] = useState<'pending' | 'sent' | 'approved' | 'rejected' | null>(null)

  // Athlete registration state
  const [sports, setSports] = useState<Sport[]>([])
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUploadStep, setCurrentUploadStep] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false) // New state for consent checkbox

  useEffect(() => {
    const fetchProfileAndSports = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (userError) throw userError
        setProfile(userData as UserProfile)
        setFormData(userData as UserProfile)

        if (userData.role === 'athlete') {
          // Always fetch all available sports for athletes
          await fetchSports() // This function already handles errors and sets 'sports' state

          const { data: athleteData, error: athleteError } = await supabase
            .from('athletes')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (athleteError && athleteError.code !== 'PGRST116') { // PGRST116 means "no rows found"
            throw athleteError
          }

          if (athleteData) {
            setAthlete(athleteData)
            setAthleteStatus(athleteData.status)

            // Fetch athlete's selected sports if athleteData exists
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
              setSelectedSports(athleteSportsData.map(as => as.sport_id))
            }
          } else {
            setAthleteStatus(null) // No athlete record found, fresh registration
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
    }
    fetchProfileAndSports()
  }, [user, toast])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone
        })
        .eq('id', user.id)
      if (error) throw error
      setProfile((prev) => ({ ...prev!, ...formData }))
      setIsEditing(false)
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.'
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível salvar suas alterações.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile as UserProfile)
    setIsEditing(false)
  }

  const handleEnrollmentChange = (file: File | null) => {
    setEnrollmentFile(file)
  }

  const handleDocumentChange = (file: File | null) => {
    setDocumentFile(file)
  }

  const handleSportToggle = (sportId: string) => {
    setSelectedSports((prev) => {
      const newSelection = prev.includes(sportId)
        ? prev.filter((id) => id !== sportId)
        : [...prev, sportId]
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
      !agreedToTerms // Check the new state here

    if (hasValidationErrors) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos do formulário e aceite os termos antes de enviar.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    const uploadFile = async (file: File, name: string) => {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${name}_${Date.now()}.${fileExt}`
      setCurrentUploadStep(`Enviando ${name === 'document' ? 'documento' : 'atestado'}...`)
      setUploadProgress(25)
      const { data: uploadData, error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
      if (uploadError) {
        console.error('Erro ao fazer upload do arquivo:', uploadError)
        throw uploadError
      }
      const {
        data: { publicUrl }
      } = supabase.storage.from('documents').getPublicUrl(filePath)
      return publicUrl
    }

    try {
      setCurrentUploadStep('Preparando documentos...')
      setUploadProgress(10)

      let documentUrl = athlete?.cnh_cpf_document_url
      if (documentFile) {
        documentUrl = await uploadFile(documentFile, 'document')
        setUploadProgress(40)
      }

      let enrollmentUrl = athlete?.enrollment_document_url
      if (enrollmentFile) {
        enrollmentUrl = await uploadFile(enrollmentFile, 'enrollment')
        setUploadProgress(60)
      }

      setCurrentUploadStep('Finalizando cadastro...')
      setUploadProgress(80)

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
        setAthlete(updatedAthlete)
        setAthleteStatus('sent')

        // Update athlete_sports for existing athlete
        const { error: deleteSportsError } = await supabase
          .from('athlete_sports')
          .delete()
          .eq('athlete_id', athlete.id)
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
        setAthlete(newAthlete)
        setAthleteStatus('sent')
      }

      setUploadProgress(100)
      setCurrentUploadStep('Concluído!')
      toast({
        title: 'Cadastro enviado com sucesso!',
        description: 'Seu cadastro de atleta foi enviado e está aguardando aprovação.'
      })
    } catch (error: any) {
      console.error('Error during athlete registration:', error)
      toast({
        title: 'Erro no cadastro',
        description: error.message || 'Não foi possível concluir o seu cadastro de atleta. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
      setCurrentUploadStep('')
    }
  }

  // Get icon for sport type
  const getSportIcon = (sportName: string, sportType: 'sport' | 'boteco') => {
    if (sportType === 'boteco') {
      return Gamepad2
    }

    // Sport-specific icons
    const sportIcons: { [key: string]: any } = {
      'futebol': Trophy,
      'basquete': Target,
      'volei': Users,
      'tenis': Zap,
      'natacao': Heart,
    }

    const normalizedName = sportName.toLowerCase()
    return sportIcons[normalizedName] || Trophy
  }

  // Get colors for sport type
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

  const StatusCard = ({ status, title, description, icon: Icon, iconColor }: {
    status: string
    title: string
    description: string
    icon: any
    iconColor: string
  }) => (
    <Card className='border-l-4 border-l-current'>
      <CardContent className='pt-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4'>
          <div className={`p-3 rounded-full ${iconColor} bg-opacity-10`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div className='flex-1 space-y-2'>
            <h3 className='text-xl font-bold'>{title}</h3>
            <p className='text-gray-600 text-sm sm:text-base'>{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const QuickSportsSelector = () => {
    const sportsData = sports.filter(sport => sport.type === 'sport')
    const botecoData = sports.filter(sport => sport.type === 'boteco')

    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-sm font-bold'>
              3
            </div>
            <h3 className='text-lg sm:text-xl font-semibold'>Modalidades de Interesse</h3>
          </div>
        </div>
        <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 space-y-6'>
          <p className='text-sm sm:text-base text-gray-600 text-center'>
            Selecione as modalidades que você gostaria de participar. Toque nos cartões para selecioná-las!
          </p>
          {/* Sports Section */}
          {sportsData.length > 0 && (
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Trophy className='h-5 w-5 text-blue-600' />
                <h4 className='font-semibold text-blue-800'>Esportes</h4>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
                {sportsData.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id)
                  const Icon = getSportIcon(sport.name, sport.type)

                  const colors = getSportColors(sport.type, isSelected)

                  return (
                    <button
                      key={sport.id}
                      onClick={() => handleSportToggle(sport.id)}
                      className={`
                        relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
                        ${colors}
                        ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-30' : ''}
                      `}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className='absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg'>
                          <CheckCircle className='h-4 w-4 text-white' />
                        </div>
                      )}
                      <div className='flex flex-col items-center space-y-2 sm:space-y-3'>
                        {/* <div className={`p-2 sm:p-3 rounded-lg ${isSelected ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-50'}`}>
                          <Icon className='h-6 w-6 sm:h-8 sm:w-8' />
                        </div> */}
                        <span className='font-medium text-xs sm:text-sm text-center leading-tight'>
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
                <Gamepad2 className='h-5 w-5 text-purple-600' />
                <h4 className='font-semibold text-purple-800'>Jogos de Boteco</h4>
              </div>
              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4'>
                {botecoData.map((sport) => {
                  const isSelected = selectedSports.includes(sport.id)
                  const Icon = getSportIcon(sport.name, sport.type)
                  const colors = getSportColors(sport.type, isSelected)

                  return (
                    <button
                      key={sport.id}
                      onClick={() => handleSportToggle(sport.id)}
                      className={`
                        relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
                        ${colors}
                        ${isSelected ? 'ring-4 ring-purple-500 ring-opacity-30' : ''}
                      `}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className='absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg'>
                          <CheckCircle className='h-4 w-4 text-white' />
                        </div>
                      )}
                      <div className='flex flex-col items-center space-y-2 sm:space-y-3'>
                        {/* <div className={`p-2 sm:p-3 rounded-lg ${isSelected ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-50'}`}>
                          <Icon className='h-6 w-6 sm:h-8 sm:w-8' />
                        </div> */}
                        <span className='font-medium text-xs sm:text-sm text-center leading-tight'>
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
            <div className='flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200'>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedSports(sports.map(s => s.id))}
                className='flex-1 text-sm'
                disabled={selectedSports.length === sports.length}
              >
                Selecionar Todas
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedSports([])}
                className='flex-1 text-sm'
                disabled={selectedSports.length === 0}
              >
                Limpar Seleção
              </Button>
            </div>
          )}
          {/* Validation Message */}
          {selectedSports.length === 0 && (
            <div className='bg-red-50 border-2 border-red-200 rounded-lg p-4'>
              <div className='flex items-center space-x-3'>
                <AlertCircle className='h-5 w-5 text-red-500 flex-shrink-0' />
                <p className='text-sm text-red-600 font-medium'>
                  Selecione pelo menos uma modalidade para continuar
                </p>
              </div>
            </div>
          )}
          {/* Success Message */}
          {selectedSports.length > 0 && (
            <div className='bg-green-50 border-2 border-green-200 rounded-lg p-4'>
              <div className='flex items-center space-x-3'>
                <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />
                <p className='text-sm text-green-600 font-medium'>
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
    <div className='space-y-6 max-w-6xl mx-auto px-4 sm:px-6'>
      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Meu Perfil</h1>
        <p className='text-sm sm:text-base text-gray-600'>Visualize e edite suas informações pessoais.</p>
      </div>

      {profile?.role === 'athlete' && (
        <Tabs defaultValue='register' className='w-full'>
          <TabsContent value='register' className='space-y-6'>
            {/* Status Cards */}
            {athleteStatus === 'approved' && (
              <StatusCard
                status="approved"
                title="Documentos Aprovados"
                description="Seus documentos foram aprovados. Bem-vindo ao time!"
                icon={CheckCircle}
                iconColor="text-green-500"
              />
            )}
            {(athleteStatus === 'sent') && (
              <StatusCard
                status="pending"
                title="Documentos em Análise"
                description="Seus documentos foram enviados e estão em análise. Avisaremos quando o processo for concluído."
                icon={Clock}
                iconColor="text-yellow-500"
              />
            )}
            {/* Registration Form */}
            {(athleteStatus === 'rejected' || athleteStatus === null || athleteStatus === 'pending') && (
              <Card className='shadow-lg'>
                <CardHeader className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 bg-[#0456FC] bg-opacity-10 rounded-lg'>
                      <FileText className='h-6 w-6 text-[#0456FC]' />
                    </div>
                    <div>
                      <CardTitle className='text-xl sm:text-2xl'>Cadastro de Atleta</CardTitle>
                      <CardDescription className='text-sm sm:text-base mt-1'>
                        Complete seu cadastro enviando os documentos necessários
                      </CardDescription>
                    </div>
                  </div>
                  {athleteStatus === 'rejected' && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                      <div className='flex items-start space-x-3'>
                        <AlertCircle className='h-5 w-5 text-red-500 mt-0.5 flex-shrink-0' />
                        <div>
                          <h4 className='font-medium text-red-800'>Cadastro rejeitado</h4>
                          <p className='text-sm text-red-700 mt-1'>
                            Seu cadastro foi rejeitado. Por favor, verifique os arquivos e envie-os novamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className='space-y-8'>
                  <form onSubmit={handleAthleteRegistration} className='space-y-8'>
                    {/* Upload Progress */}
                    {isSubmitting && (
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3'>
                        <div className='flex items-center space-x-3'>
                          <Loader2 className='h-5 w-5 text-blue-500 animate-spin' />
                          <span className='font-medium text-blue-800'>{currentUploadStep}</span>
                        </div>
                        <Progress value={uploadProgress} className='w-full' />
                        <p className='text-sm text-blue-600'>
                          {uploadProgress}% concluído - Não feche esta página
                        </p>
                      </div>
                    )}
                    {/* File Uploads */}
                    <div className='grid gap-6 sm:gap-8'>
                      <div className='space-y-4'>
                        <div className='flex items-center space-x-2'>
                          <div className='w-8 h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-sm font-bold'>
                            1
                          </div>
                          <h3 className='text-lg font-semibold'>Documento com Foto</h3>
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
                      <div className='space-y-4'>
                        <div className='flex items-center space-x-2'>
                          <div className='w-8 h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-sm font-bold'>
                            2
                          </div>
                          <h3 className='text-lg font-semibold'>Atestado de Matrícula</h3>
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
                    </div>
                    {/* Sports Selection */}
                    <QuickSportsSelector />
                    {/* Consent Checkbox */}
                    <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3'>
                      <div className='flex items-start space-x-3'>
                        <Checkbox
                          id='terms'
                          checked={agreedToTerms}
                          onCheckedChange={() => setAgreedToTerms(!agreedToTerms)}
                          className='mt-1 h-5 w-5 border-gray-400 data-[state=checked]:bg-[#0456FC] data-[state=checked]:border-[#0456FC] focus:ring-[#0456FC] focus:ring-offset-0'
                        />
                        <Label htmlFor='terms' className='text-sm text-gray-800 leading-relaxed cursor-pointer'>
                          Eu li e concordo com os{' '}
                          <a href='#' className='text-[#0456FC] hover:underline font-medium' onClick={(e) => e.preventDefault()}>
                            Termos de Uso e Política de Privacidade
                          </a>
                          , incluindo o compartilhamento dos meus direitos de imagem e dados legais para fins de registro e participação em eventos.
                        </Label>
                      </div>
                      {!agreedToTerms && (
                        <div className='bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2'>
                          <AlertCircle className='h-4 w-4 text-red-500 flex-shrink-0' />
                          <p className='text-xs text-red-600 font-medium'>
                            Você deve concordar com os termos para prosseguir.
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Submit Button */}
                    <div className='pt-4'>
                      <Button
                        type='submit'
                        className='w-full bg-gradient-to-r from-[#0456FC] to-[#0345D1] hover:from-[#0345D1] hover:to-[#0234B8] text-white font-bold py-4 text-base sm:text-lg transition-all duration-200 disabled:opacity-50 shadow-lg'
                        disabled={
                          isSubmitting ||
                          (!documentFile && !athlete?.cnh_cpf_document_url) ||
                          (!enrollmentFile && !athlete?.enrollment_document_url) ||
                          selectedSports.length === 0 ||
                          !agreedToTerms // Add this condition
                        }
                      >
                        {isSubmitting ? (
                          <div className='flex items-center justify-center space-x-2'>
                            <Loader2 className='h-5 w-5 animate-spin' />
                            <span>Enviando...</span>
                          </div>
                        ) : (
                          <div className='flex items-center justify-center space-x-2'>
                            <Upload className='h-5 w-5' />
                            <span>Enviar e Finalizar Cadastro</span>
                          </div>
                        )}
                      </Button>
                      <p className='text-xs text-gray-500 text-center mt-3'>
                        Ao enviar, você concorda que as informações fornecidas são verdadeiras
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
