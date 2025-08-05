"use client"

import type React from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { CheckCircle, Copy, FileText, Share2, X } from "lucide-react"
import { useEffect, useState } from "react"

type Athlete = {
  id: string
  user_id: string
  athletic_id: string
  enrollment_document_url: string
  status: "pending" | "sent" | "approved" | "rejected"
  created_at: string
  cnh_cpf_document_url: string
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
    type: "sport" | "bar_game"
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
  type: "sport" | "bar_game"
}

export default function AthletesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [athleticId, setAthleticId] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [athleticLink, setAthleticLink] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAthleticFilter, setSelectedAthleticFilter] = useState("all")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")
  const [documentType, setDocumentType] = useState<"enrollment" | null>(null)

  // For athlete registration
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null)
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [selectedAthleticId, setSelectedAthleticId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUserAthlete, setIsUserAthlete] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      setIsLoading(true)

      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userError) throw userError
        setUserRole(userData.role)

        const { data: athleteData, error: athleteCheckError } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (athleteCheckError) {
          console.warn("Error checking athlete status:", athleteCheckError)
        } else {
          setIsUserAthlete(!!athleteData)
        }

        let athleticIdForQuery: string | null = null

        if (userData.role === "athletic") {
          const { data: athleticData, error: athleticError } = await supabase
            .from("athletics")
            .select("id")
            .eq("representative_id", user.id)
            .maybeSingle()

          if (athleticError) {
            console.warn("Error fetching athletic data:", athleticError)
          } else if (athleticData) {
            athleticIdForQuery = athleticData.id
            setAthleticId(athleticData.id)
            setAthleticLink(`${window.location.origin}/register/athletic/${athleticData.id}`)
          }
        }

        const athletesQuery = supabase
          .from("athletes")
          .select(`
            *,
            user:users(name, email, cpf, phone, gender),
            athletic:athletics(name),
            athlete_sports(
              sport:sports(id, name, type)
            )
          `)
          .order("created_at", { ascending: false })

        if (userData.role === "admin") {
          const athleticFilter = searchParams.get("athletic")
          if (athleticFilter && athleticFilter !== "all") {
            athletesQuery.eq("athletic_id", athleticFilter)
          }
        } else if (userData.role === "athletic" && athleticIdForQuery) {
          athletesQuery.eq("athletic_id", athleticIdForQuery)
        }

        const { data: athletesData, error: athletesError } = await athletesQuery
        if (athletesError) throw athletesError
        
        // Map the data to match our Athlete type
        const formattedAthletes = athletesData.map(athlete => ({
          ...athlete,
          sports: (athlete.athlete_sports as Array<{sport: {id: string, name: string, type: 'sport' | 'bar_game'}}> | null)?.map(as => as.sport) || []
        }))
        
        setAthletes(formattedAthletes as Athlete[])

        if (userData.role === "admin") {
          const { data: athleticsData, error: athleticsError } = await supabase
            .from("athletics")
            .select("id, name, university")
            .order("name")

          if (athleticsError) throw athleticsError
          setAthletics(athleticsData as Athletic[])
        }

        const { data: sportsData, error: sportsError } = await supabase
          .from("sports")
          .select("id, name, type")
          .order("name")

        if (sportsError) throw sportsError
        setSports(sportsData as Sport[])
      } catch (error) {
        console.warn("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os atletas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast, searchParams])

  const handleEnrollmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEnrollmentFile(e.target.files[0])
    }
  }

  const handleSportToggle = (sportId: string) => {
    setSelectedSports((prev) => (prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]))
  }

  const handleAthleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !enrollmentFile || !selectedAthleticId || selectedSports.length === 0) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload enrollment document
      const enrollmentFileName = `${user.id}-enrollment-${Date.now()}`
      const { error: enrollmentError } = await supabase.storage
        .from("athlete-documents")
        .upload(enrollmentFileName, enrollmentFile)

      if (enrollmentError) throw enrollmentError

      // Get enrollment document URL
      const { data: enrollmentUrl } = supabase.storage.from("athlete-documents").getPublicUrl(enrollmentFileName)

      // Create athlete record
      const { data: athleteData, error: athleteError } = await supabase
        .from("athletes")
        .insert({
          user_id: user.id,
          athletic_id: selectedAthleticId,
          enrollment_document_url: enrollmentUrl.publicUrl,
          cnh_cpf_document_url: enrollmentUrl.publicUrl,
          status: "pending",
        })
        .select()

      if (athleteError) throw athleteError

      if (!athleteData || athleteData.length === 0) {
        throw new Error("Failed to create athlete record")
      }

      // Add athlete sports
      const athleteSports = selectedSports.map((sportId) => ({
        athlete_id: athleteData[0].id,
        sport_id: sportId,
      }))

      const { error: sportsError } = await supabase.from("athlete_sports").insert(athleteSports)

      if (sportsError) throw sportsError

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Seu cadastro como atleta foi enviado para aprovação.",
      })

      // Update local state to reflect the new registration
      setIsUserAthlete(true)

      // Refresh the data
      const { data: newAthleteData } = await supabase
        .from("athletes")
        .select(`
          *,
          user:users(name, email, cpf, phone, gender),
          athletic:athletics(name)
        `)
        .eq("id", athleteData[0].id)
        .single()

      if (newAthleteData) {
        setAthletes((prev) => [newAthleteData as Athlete, ...prev])
      }
    } catch (error) {
      console.warn("Error registering athlete:", error)
      toast({
        title: "Erro no cadastro",
        description: "Não foi possível completar o cadastro de atleta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveAthlete = async (athleteId: string) => {
    try {
      const { error } = await supabase.from("athletes").update({ status: "approved" }).eq("id", athleteId)

      if (error) throw error

      toast({
        title: "Atleta aprovado",
        description: "O atleta foi aprovado com sucesso.",
      })

      // Update local state
      setAthletes((prev) =>
        prev.map((athlete) => (athlete.id === athleteId ? { ...athlete, status: "approved" } : athlete)),
      )
    } catch (error) {
      console.warn("Error approving athlete:", error)
      toast({
        title: "Erro na aprovação",
        description: "Não foi possível aprovar o atleta.",
        variant: "destructive",
      })
    }
  }

  const handleRejectAthlete = async (athleteId: string) => {
    try {
      const { error } = await supabase.from("athletes").update({ status: "rejected" }).eq("id", athleteId)

      if (error) throw error

      toast({
        title: "Atleta rejeitado",
        description: "O atleta foi rejeitado.",
      })

      // Update local state
      setAthletes((prev) =>
        prev.map((athlete) => (athlete.id === athleteId ? { ...athlete, status: "rejected" } : athlete)),
      )
    } catch (error) {
      console.warn("Error rejecting athlete:", error)
      toast({
        title: "Erro na rejeição",
        description: "Não foi possível rejeitar o atleta.",
        variant: "destructive",
      })
    }
  }

  const handleShareLink = (athleticId: string) => {
    const link = `${window.location.origin}/register?type=athlete&athletic=${athleticId}`
    setShareLink(link)
    setShareDialogOpen(true)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      })
    }
  }

  const handleCopyAthleticLink = async () => {
    try {
      await navigator.clipboard.writeText(athleticLink)
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      })
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleAthleticFilterChange = (athleticId: string) => {
    setSelectedAthleticFilter(athleticId)
    const params = new URLSearchParams(window.location.search)
    if (athleticId === "all") {
      params.delete("athletic")
    } else {
      params.set("athletic", athleticId)
    }
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)
    // Manually trigger a re-fetch by updating a dependency in useEffect
    // A better way might be to use Next.js router to navigate
    // For now, we rely on searchParams dependency in useEffect
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const handleOpenDocumentDialog = (url: string) => {
    setDocumentUrl(url)
    setDocumentType("enrollment")
    setDocumentDialogOpen(true)
  }

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch = athlete.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAthletic = selectedAthleticFilter === "all" || athlete.athletic_id === selectedAthleticFilter
    const matchesStatus = selectedStatusFilter === "all" || athlete.status === selectedStatusFilter
    
    return matchesSearch && matchesAthletic && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]"></div>
      </div>
    )
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center px-4 py-10">
      <div className="p-4 bg-gray-100 rounded-full">
        <Users className="h-12 w-12 text-gray-400" />
      </div>
      <h2 className="mt-6 text-2xl font-bold">Nenhum atleta cadastrado</h2>
      <p className="mt-2 text-base text-gray-500">
        Parece que sua atlética ainda não tem atletas.
        <br />
        Compartilhe o link de cadastro para começar a montar sua equipe!
      </p>
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => handleShareLink(athleticId!)} className="mt-6 bg-[#0456FC] w-full md:w-auto">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar Link de Cadastro
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link de Cadastro</DialogTitle>
            <DialogDescription>
              Compartilhe este link com os atletas da sua atlética para que eles possam se cadastrar diretamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input value={shareLink} readOnly className="flex-1" />
            <Button onClick={handleCopyLink} variant="outline" size="icon">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
  const renderNoResults = () => (
    <div className="text-center py-10">
      <p className="text-gray-500">Nenhum atleta encontrado com os filtros aplicados.</p>
    </div>
  )

const AthleteCard = ({
  athlete,
  userRole,
  handleOpenDocumentDialog,
  handleRejectAthlete,
  handleApproveAthlete,
}: {
  athlete: Athlete
  userRole: string | null
  handleOpenDocumentDialog: (url: string) => void
  handleRejectAthlete: (id: string) => void
  handleApproveAthlete: (id: string) => void
}) => (
  <Card>
    <CardHeader className="pb-3 sm:pb-4 space-y-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <CardTitle className="text-lg sm:text-xl break-words pr-2">{athlete.user.name}</CardTitle>
        <Badge
          className={`text-xs sm:text-sm whitespace-nowrap ${
            athlete.status === "approved"
              ? "bg-green-500"
              : athlete.status === "rejected"
                ? "bg-red-500"
                : athlete.status === "pending"
                  ? "bg-yellow-500"
                  : athlete.status === "sent"
                    ? "bg-blue-500"
                    : "bg-gray-500"
          }`}
        >
          {athlete.status === "approved"
            ? "Aprovado"
            : athlete.status === "rejected"
              ? "Rejeitado"
              : athlete.status === "pending"
                ? "Pendente"
                : athlete.status === "sent"
                  ? "Aguardando aprovação"
                  : ""}
        </Badge>
      </div>
      <CardDescription className="text-sm sm:text-base">
        <span className="font-medium">Atlética:</span> {athlete.athletic.name}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">E-mail</p>
          <p className="text-sm sm:text-base break-all">{athlete.user.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">CPF</p>
          <p className="text-sm sm:text-base">{athlete.user.cpf}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Telefone</p>
          <p className="text-sm sm:text-base">{athlete.user.phone}</p>
        </div>
        {athlete.sports && athlete.sports.length > 0 && (
          <div className="col-span-2 space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Esportes</p>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {athlete.sports.map((sport) => (
                <Badge key={sport.id} variant="outline" className="text-xs sm:text-sm py-0.5 px-2">
                  {sport.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => handleOpenDocumentDialog(athlete.cnh_cpf_document_url)}
          disabled={!athlete.cnh_cpf_document_url}
        >
          <FileText className="h-4 w-4 mr-1" />
          Ver Documento
        </Button>
        <Button
          variant="link"
          className="p-0 h-auto"
          onClick={() => handleOpenDocumentDialog(athlete.enrollment_document_url)}
          disabled={!athlete.enrollment_document_url}
        >
          <FileText className="h-4 w-4 mr-1" />
          Ver Matrícula
        </Button>
      </div>
    </CardContent>
    {(userRole === "admin" || userRole === "athletic") && athlete.status === "sent" && (
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleRejectAthlete(athlete.id)}
        >
          <X className="h-4 w-4 mr-1" />
          Rejeitar
        </Button>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveAthlete(athlete.id)}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Aprovar
        </Button>
      </CardFooter>
    )}
  </Card>
)

  const renderAthletesList = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="w-full">
          <Input placeholder="Buscar por nome..." value={searchTerm} onChange={handleSearchChange} className="w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {userRole === "admin" && (
            <div className="w-full">
              <Select onValueChange={handleAthleticFilterChange} value={selectedAthleticFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por atlética" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Atléticas</SelectItem>
                  {athletics.map((athletic) => (
                    <SelectItem key={athletic.id} value={athletic.id}>
                      {athletic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="w-full">
            <Select onValueChange={(value) => setSelectedStatusFilter(value)} value={selectedStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="sent">Aguardando Aprovação</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {filteredAthletes.length === 0 ? (
        userRole === "athletic" ? (
          renderEmptyState()
        ) : (
          renderNoResults()
        )
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 lg:grid-cols-2">
          {filteredAthletes.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              userRole={userRole}
              handleOpenDocumentDialog={handleOpenDocumentDialog}
              handleRejectAthlete={handleRejectAthlete}
              handleApproveAthlete={handleApproveAthlete}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Atletas</h1>
          <p className="text-sm md:text-base text-gray-500">
            {userRole === "admin"
              ? "Gerencie todos os atletas do campeonato."
              : userRole === "athletic"
                ? "Gerencie os atletas da sua atlética."
                : "Cadastre-se como atleta ou veja seu status."}
          </p>
        </div>
        {userRole === "athletic" && athletes.length > 0 && (
          <div className="flex justify-end">
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleShareLink(athleticId!)} className="bg-[#0456FC] w-full md:w-auto">
                  <Share2 className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Compartilhar Link</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Link de Cadastro</DialogTitle>
                  <DialogDescription>
                    Compartilhe este link com os atletas da sua atlética para que eles possam se cadastrar diretamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                  <Input value={shareLink} readOnly className="flex-1" />
                  <Button onClick={handleCopyLink} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {userRole === "athletic" || userRole === "admin" ? (
        renderAthletesList()
      ) : (
        <Tabs defaultValue={isUserAthlete ? "list" : "register"}>
          <TabsList>
            <TabsTrigger value="list">Meus Dados de Atleta</TabsTrigger>
            {!isUserAthlete && <TabsTrigger value="register">Cadastrar como Atleta</TabsTrigger>}
          </TabsList>
          <TabsContent value="list">
            {isUserAthlete ? renderAthletesList() : <p>Você ainda não é um atleta registrado.</p>}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visualizador de Documento</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {documentUrl ? (
              <div className="flex justify-center">
                <iframe src={documentUrl} className="w-full h-[70vh] border rounded-md" title="Documento" />
              </div>
            ) : (
              <p className="text-center text-gray-500">Documento não encontrado.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
