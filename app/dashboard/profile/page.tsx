"use client"

import type React from "react"
import { useEffect, useState } from "react"
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
  File,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { uploadFileToR2 } from "@/actions/upload"

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
  type: "sport" | "boteco"
}

type Athlete = {
  id: string
  user_id: string
  enrollment_document_url: string
  cnh_cpf_document_url: string
  status: "pending" | "sent" | "approved" | "rejected"
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

// Component to display uploaded file with responsive URL handling
const UploadedFileDisplay = ({ url, label }: { url: string; label: string }) => {
  const fileName = url.split("/").pop() || "arquivo"
  const truncatedUrl = truncateUrl(url)

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <File className="h-5 w-5 text-green-600 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-green-800 truncate">{label} enviado</p>
              <p className="text-xs text-green-600 break-all sm:hidden">{fileName}</p>
              <p className="text-xs text-green-600 hidden sm:block">{truncatedUrl}</p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs text-green-700 hover:text-green-800 hover:underline flex-shrink-0"
            >
              <span>Ver arquivo</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
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
  const [athleteStatus, setAthleteStatus] = useState<"pending" | "sent" | "approved" | "rejected" | null>(null)

  // Athlete registration state
  const [sports, setSports] = useState<Sport[]>([])
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUploadStep, setCurrentUploadStep] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    const fetchProfileAndSports = async () => {
      if (!user) return
      setIsLoading(true)
      try {
        const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()
        if (userError) throw userError
        setProfile(userData as UserProfile)

        if (userData.role === "athlete") {
          await fetchSports()

          const { data: athleteData, error: athleteError } = await supabase
            .from("athletes")
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (athleteError && athleteError.code !== "PGRST116") {
            throw athleteError
          }

          if (athleteData) {
            setAthlete(athleteData)
            setAthleteStatus(athleteData.status)

            const { data: athleteSportsData, error: athleteSportsError } = await supabase
              .from("athlete_sports")
              .select("sport_id")
              .eq("athlete_id", athleteData.id)

            if (athleteSportsError) {
              console.error("Error fetching athlete sports:", athleteSportsError)
              toast({
                title: "Erro ao carregar modalidades do atleta",
                description: "Não foi possível carregar suas modalidades selecionadas.",
                variant: "destructive",
              })
            } else if (athleteSportsData) {
              setSelectedSports(athleteSportsData.map((as) => as.sport_id))
            }
          } else {
            setAthleteStatus(null)
          }
        }
      } catch (error) {
        console.error("Error fetching profile or sports:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar seu perfil ou modalidades.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfileAndSports()
  }, [user, toast])

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase.from("sports").select("*")
      if (error) throw error
      setSports(data)
    } catch (error) {
      console.error("Error fetching sports:", error)
      toast({
        title: "Erro ao carregar modalidades",
        description: "Não foi possível carregar a lista de modalidades.",
        variant: "destructive",
      })
    }
  }

  // Validação de tamanho de arquivo no cliente para feedback imediato
  const handleEnrollmentChange = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "Arquivo muito grande",
        description: `O atestado excede o limite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: "destructive",
      })
      setEnrollmentFile(null)
      return
    }
    setEnrollmentFile(file)
  }

  const handleDocumentChange = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "Arquivo muito grande",
        description: `O documento excede o limite de ${MAX_FILE_SIZE_MB}MB.`,
        variant: "destructive",
      })
      setDocumentFile(null)
      return
    }
    setDocumentFile(file)
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
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do formulário e aceite os termos antes de enviar.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      setCurrentUploadStep("Preparando documentos...")
      setUploadProgress(10)

      let documentUrl = athlete?.cnh_cpf_document_url
      if (documentFile) {
        const formDataDoc = new FormData()
        formDataDoc.append("file", documentFile)
        const uploadResult = await uploadFileToR2(formDataDoc, user.id, "document", athlete?.cnh_cpf_document_url)
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || "Erro ao fazer upload do documento.")
        }
        documentUrl = uploadResult.url
        setUploadProgress(40)
      }

      let enrollmentUrl = athlete?.enrollment_document_url
      if (enrollmentFile) {
        const formDataEnroll = new FormData()
        formDataEnroll.append("file", enrollmentFile)
        const uploadResult = await uploadFileToR2(
          formDataEnroll,
          user.id,
          "enrollment",
          athlete?.enrollment_document_url,
        )
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || "Erro ao fazer upload do atestado.")
        }
        enrollmentUrl = uploadResult.url
        setUploadProgress(60)
      }

      setCurrentUploadStep("Finalizando cadastro...")
      setUploadProgress(80)

      if (athlete) {
        const { data: updatedAthlete, error: updateError } = await supabase
          .from("athletes")
          .update({
            cnh_cpf_document_url: documentUrl,
            enrollment_document_url: enrollmentUrl,
            status: "sent",
          })
          .eq("id", athlete.id)
          .select()
          .single()
        if (updateError) throw updateError
        setAthlete(updatedAthlete)
        setAthleteStatus("sent")

        const { error: deleteSportsError } = await supabase.from("athlete_sports").delete().eq("athlete_id", athlete.id)
        if (deleteSportsError) throw deleteSportsError

        const athleteSports = selectedSports.map((sportId) => ({
          athlete_id: athlete.id,
          sport_id: sportId,
        }))
        const { error: insertSportsError } = await supabase.from("athlete_sports").insert(athleteSports)
        if (insertSportsError) throw insertSportsError
      } else {
        const { data: newAthlete, error: insertError } = await supabase
          .from("athletes")
          .insert({
            user_id: user.id,
            cnh_cpf_document_url: documentUrl!,
            enrollment_document_url: enrollmentUrl!,
            status: "sent",
          })
          .select()
          .single()
        if (insertError) throw insertError

        const athleteSports = selectedSports.map((sportId) => ({
          athlete_id: newAthlete.id,
          sport_id: sportId,
        }))
        const { error: sportsError } = await supabase.from("athlete_sports").insert(athleteSports)
        if (sportsError) throw sportsError
        setAthlete(newAthlete)
        setAthleteStatus("sent")
      }

      setUploadProgress(100)
      setCurrentUploadStep("Concluído!")
      toast({
        title: "Cadastro enviado com sucesso!",
        description: "Seu cadastro de atleta foi enviado e está aguardando aprovação.",
      })
    } catch (error: any) {
      console.error("Error during athlete registration:", error)
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível concluir o seu cadastro de atleta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
      setCurrentUploadStep("")
    }
  }

  const getSportIcon = (sportName: string, sportType: "sport" | "boteco") => {
    if (sportType === "boteco") {
      return Gamepad2
    }

    const sportIcons: { [key: string]: any } = {
      futebol: Trophy,
      basquete: Target,
      volei: Users,
      tenis: Zap,
      natacao: Heart,
    }

    const normalizedName = sportName.toLowerCase()
    return sportIcons[normalizedName] || Trophy
  }

  const getSportColors = (sportType: "sport" | "boteco", isSelected: boolean) => {
    if (sportType === "sport") {
      return isSelected
        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25"
        : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300"
    } else {
      return isSelected
        ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/25"
        : "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#0456FC]" />
          <p className="text-sm text-gray-500">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  const StatusCard = ({
    status,
    title,
    description,
    icon: Icon,
    iconColor,
  }: {
    status: string
    title: string
    description: string
    icon: any
    iconColor: string
  }) => (
    <Card className="border-l-4 border-l-current">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className={`p-3 rounded-full ${iconColor} bg-opacity-10 flex-shrink-0`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold">{title}</h3>
            <p className="text-gray-600 text-sm sm:text-base">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const QuickSportsSelector = () => {
    const sportsData = sports.filter((sport) => sport.type === "sport")
    const botecoData = sports.filter((sport) => sport.type === "boteco")

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold">Modalidades de Interesse</h3>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 lg:p-6 space-y-6">
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 text-center">
            Selecione as modalidades que você gostaria de participar. Toque nos cartões para selecioná-las!
          </p>
          {/* Sports Section */}
          {sportsData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Esportes</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
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
                        ${isSelected ? "ring-4 ring-blue-500 ring-opacity-30" : ""}
                      `}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      )}
                      <div className="flex flex-col items-center space-y-1 sm:space-y-2 lg:space-y-3">
                        <div
                          className={`p-1.5 sm:p-2 lg:p-3 rounded-lg ${
                            isSelected ? "bg-white bg-opacity-20" : "bg-white bg-opacity-50"
                          }`}
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm text-center leading-tight break-words">
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
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                <h4 className="font-semibold text-purple-800 text-sm sm:text-base">Jogos de Boteco</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
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
                        ${isSelected ? "ring-4 ring-purple-500 ring-opacity-30" : ""}
                      `}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      )}
                      <div className="flex flex-col items-center space-y-1 sm:space-y-2 lg:space-y-3">
                        <div
                          className={`p-1.5 sm:p-2 lg:p-3 rounded-lg ${
                            isSelected ? "bg-white bg-opacity-20" : "bg-white bg-opacity-50"
                          }`}
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm text-center leading-tight break-words">
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedSports(sports.map((s) => s.id))}
                className="flex-1 text-xs sm:text-sm"
                disabled={selectedSports.length === sports.length}
              >
                Selecionar Todas
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedSports([])}
                className="flex-1 text-xs sm:text-sm"
                disabled={selectedSports.length === 0}
              >
                Limpar Seleção
              </Button>
            </div>
          )}
          {/* Validation Message */}
          {selectedSports.length === 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-red-600 font-medium">
                  Selecione pelo menos uma modalidade para continuar
                </p>
              </div>
            </div>
          )}
          {/* Success Message */}
          {selectedSports.length > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-green-600 font-medium">
                  Perfeito! Você selecionou {selectedSports.length} modalidade{selectedSports.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600">Visualize e edite suas informações pessoais.</p>
      </div>

      {profile?.role === "athlete" && (
        <Tabs defaultValue="register" className="w-full">
          <TabsContent value="register" className="space-y-4 sm:space-y-6">
            {/* Status Cards */}
            {athleteStatus === "approved" && (
              <StatusCard
                status="approved"
                title="Documentos Aprovados"
                description="Seus documentos foram aprovados. Bem-vindo ao time!"
                icon={CheckCircle}
                iconColor="text-green-500"
              />
            )}
            {athleteStatus === "sent" && (
              <StatusCard
                status="pending"
                title="Documentos em Análise"
                description="Seus documentos foram enviados e estão em análise. Avisaremos quando o processo for concluído."
                icon={Clock}
                iconColor="text-yellow-500"
              />
            )}
            {/* Registration Form */}
            {(athleteStatus === "rejected" || athleteStatus === null || athleteStatus === "pending") && (
              <Card className="shadow-lg">
                <CardHeader className="space-y-4 p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#0456FC] bg-opacity-10 rounded-lg flex-shrink-0">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-[#0456FC]" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg sm:text-xl lg:text-2xl">Cadastro de Atleta</CardTitle>
                      <CardDescription className="text-xs sm:text-sm lg:text-base mt-1">
                        Complete seu cadastro enviando os documentos necessários
                      </CardDescription>
                    </div>
                  </div>
                  {athleteStatus === "rejected" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-medium text-red-800 text-sm sm:text-base">Cadastro rejeitado</h4>
                          <p className="text-xs sm:text-sm text-red-700 mt-1">
                            Seu cadastro foi rejeitado. Por favor, verifique os arquivos e envie-os novamente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
                  <form onSubmit={handleAthleteRegistration} className="space-y-6 sm:space-y-8">
                    {/* Upload Progress */}
                    {isSubmitting && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-3">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 animate-spin flex-shrink-0" />
                          <span className="font-medium text-blue-800 text-sm sm:text-base">{currentUploadStep}</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-xs sm:text-sm text-blue-600">
                          {uploadProgress}% concluído - Não feche esta página
                        </p>
                      </div>
                    )}
                    {/* File Uploads */}
                    <div className="grid gap-4 sm:gap-6 lg:gap-8">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                            1
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold">Documento com Foto</h3>
                        </div>
                        {athlete?.cnh_cpf_document_url ? (
                          <UploadedFileDisplay url={athlete.cnh_cpf_document_url} label="Documento com foto" />
                        ) : (
                          <FileUpload
                            id="document"
                            label="CNH ou RG com foto"
                            description="Envie uma foto clara do seu documento de identidade (frente e verso se necessário)"
                            existingFileUrl={athlete?.cnh_cpf_document_url}
                            onFileChange={handleDocumentChange}
                            required={!athlete?.cnh_cpf_document_url}
                          />
                        )}
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#0456FC] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                            2
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold">Atestado de Matrícula</h3>
                        </div>
                        {athlete?.enrollment_document_url ? (
                          <UploadedFileDisplay url={athlete.enrollment_document_url} label="Atestado de matrícula" />
                        ) : (
                          <FileUpload
                            id="enrollment"
                            label="Comprovante de matrícula atual"
                            description="O atestado deve ser recente e comprovar sua matrícula na instituição de ensino"
                            existingFileUrl={athlete?.enrollment_document_url}
                            onFileChange={handleEnrollmentChange}
                            required={!athlete?.enrollment_document_url}
                          />
                        )}
                      </div>
                    </div>
                    {/* Sports Selection */}
                    <QuickSportsSelector />
                    {/* Consent Checkbox */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                          className="mt-1 h-4 w-4 sm:h-5 sm:w-5 border-gray-400 text-[#0456FC] focus:ring-[#0456FC] focus:ring-offset-0 flex-shrink-0"
                        />
                        <Label
                          htmlFor="terms"
                          className="text-xs sm:text-sm text-gray-800 leading-relaxed cursor-pointer"
                        >
                          Eu li e concordo com os{" "}
                          <a
                            href="#"
                            className="text-[#0456FC] hover:underline font-medium"
                            onClick={(e) => e.preventDefault()}
                          >
                            Termos de Uso e Política de Privacidade
                          </a>
                          , incluindo o compartilhamento dos meus direitos de imagem e dados legais para fins de
                          registro e participação em eventos.
                        </Label>
                      </div>
                      {!agreedToTerms && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 flex items-center space-x-2">
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                          <p className="text-xs text-red-600 font-medium">
                            Você deve concordar com os termos para prosseguir.
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#0456FC] to-[#0345D1] hover:from-[#0345D1] hover:to-[#0234B8] text-white font-bold py-3 sm:py-4 text-sm sm:text-base lg:text-lg transition-all duration-200 disabled:opacity-50 shadow-lg"
                        disabled={
                          isSubmitting ||
                          (!documentFile && !athlete?.cnh_cpf_document_url) ||
                          (!enrollmentFile && !athlete?.enrollment_document_url) ||
                          selectedSports.length === 0 ||
                          !agreedToTerms
                        }
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center space-x-2">
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            <span>Enviando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Enviar e Finalizar Cadastro</span>
                          </div>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2 sm:mt-3">
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