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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { CheckCircle, Copy, FileText, Share2, User, X } from "lucide-react"
import { useEffect, useState } from "react"

type Athlete = {
  id: string
  user_id: string
  athletic_id: string
  photo_url: string
  enrollment_document_url: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
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
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")
  const [documentType, setDocumentType] = useState<"photo" | "enrollment" | null>(null)

  // For athlete registration
  const [photoFile, setPhotoFile] = useState<File | null>(null)
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
          .select(`*, user:users(name, email, cpf, phone, gender), athletic:athletics(name)`)
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
        setAthletes(athletesData as Athlete[])

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])
    }
  }

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

    if (!user || !photoFile || !enrollmentFile || !selectedAthleticId || selectedSports.length === 0) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Upload photo
      const photoFileName = `${user.id}-photo-${Date.now()}`
      const { error: photoError } = await supabase.storage.from("athlete-documents").upload(photoFileName, photoFile)

      if (photoError) throw photoError

      // Get photo URL
      const { data: photoUrl } = supabase.storage.from("athlete-documents").getPublicUrl(photoFileName)

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
          photo_url: photoUrl.publicUrl,
          enrollment_document_url: enrollmentUrl.publicUrl,
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

  const handleOpenDocumentDialog = (url: string, type: "photo" | "enrollment") => {
    setDocumentUrl(url)
    setDocumentType(type)
    setDocumentDialogOpen(true)
  }

  const filteredAthletes = athletes.filter((athlete) =>
    athlete.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Atletas</h1>
          <p className="text-gray-500">
            {userRole === "admin"
              ? "Gerencie todos os atletas do campeonato."
              : userRole === "athletic"
                ? "Gerencie os atletas da sua atlética."
                : "Cadastre-se como atleta ou veja seu status."}
          </p>
        </div>
        {userRole === "athletic" && (
          <div className="flex gap-2">
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleShareLink(athleticId!)} className="bg-[#0456FC]">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar Link
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
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

      <Tabs defaultValue={isUserAthlete || userRole === "athletic" || userRole === "admin" ? "list" : "register"}>
        <TabsList>
          <TabsTrigger value="list">Lista de Atletas</TabsTrigger>
          {userRole === "buyer" && !isUserAthlete && <TabsTrigger value="register">Cadastrar como Atleta</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-4">
            <Input placeholder="Buscar por nome..." value={searchTerm} onChange={handleSearchChange} />
            {userRole === "admin" && (
              <Select onValueChange={handleAthleticFilterChange} value={selectedAthleticFilter}>
                <SelectTrigger>
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
            )}
          </div>

          {filteredAthletes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  {userRole === "athletic"
                    ? "Sua atlética ainda não possui atletas cadastrados."
                    : "Nenhum atleta encontrado."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {filteredAthletes.map((athlete) => (
                <Card key={athlete.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{athlete.user.name}</CardTitle>
                      <Badge
                        className={
                          athlete.status === "approved"
                            ? "bg-green-500"
                            : athlete.status === "rejected"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }
                      >
                        {athlete.status === "approved"
                          ? "Aprovado"
                          : athlete.status === "rejected"
                            ? "Rejeitado"
                            : "Pendente"}
                      </Badge>
                    </div>
                    <CardDescription>Atlética: {athlete.athletic.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">E-mail:</p>
                        <p className="text-sm">{athlete.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">CPF:</p>
                        <p className="text-sm">{athlete.user.cpf}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Telefone:</p>
                        <p className="text-sm">{athlete.user.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gênero:</p>
                        <p className="text-sm capitalize">
                          {athlete.user.gender === "male"
                            ? "Masculino"
                            : athlete.user.gender === "female"
                              ? "Feminino"
                              : athlete.user.gender === "other"
                                ? "Outro"
                                : "Prefiro não informar"}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-2">
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => handleOpenDocumentDialog(athlete.photo_url, "photo")}
                      >
                        <User className="h-4 w-4 mr-1" />
                        Ver Foto
                      </Button>
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => handleOpenDocumentDialog(athlete.enrollment_document_url, "enrollment")}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Atestado
                      </Button>
                    </div>
                  </CardContent>

                  {(userRole === "admin" || userRole === "athletic") && athlete.status === "pending" && (
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRejectAthlete(athlete.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveAthlete(athlete.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {documentType === "photo" ? "Foto do Atleta" : "Atestado de Matrícula"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <img src={documentUrl} alt="Documento" className="w-full h-auto" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
