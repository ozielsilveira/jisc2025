"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, FileText, Upload, User, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [athleticId, setAthleticId] = useState<string | null>(null)

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

      try {
        // Get user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (userError) throw userError
        setUserRole(userData.role)

        // Check if user is already an athlete
        const { data: athleteData, error: athleteCheckError } = await supabase
          .from("athletes")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()

        if (!athleteCheckError) {
          setIsUserAthlete(!!athleteData)
        }

        // If user is athletic, get their athletic ID
        if (userData.role === "athletic") {
          const { data: athleticData, error: athleticError } = await supabase
            .from("athletics")
            .select("id")
            .eq("id", user.id)
            .single()

          if (!athleticError && athleticData) {
            setAthleticId(athleticData.id)
          }
        }

        // Fetch athletes based on role
        let query = supabase
          .from("athletes")
          .select(`
            *,
            user:users(name, email, cpf, phone, gender),
            athletic:athletics(name)
          `)
          .order("created_at", { ascending: false })

        if (userData.role === "athletic" && athleticId) {
          query = query.eq("athletic_id", athleticId)
        }

        const { data: athletesData, error: athletesError } = await query

        if (athletesError) throw athletesError
        setAthletes(athletesData as Athlete[])

        // Fetch athletics for dropdown
        const { data: athleticsData, error: athleticsError } = await supabase
          .from("athletics")
          .select("id, name, university")
          .order("name")

        if (athleticsError) throw athleticsError
        setAthletics(athleticsData as Athletic[])

        // Fetch sports for selection
        const { data: sportsData, error: sportsError } = await supabase
          .from("sports")
          .select("id, name, type")
          .order("name")

        if (sportsError) throw sportsError
        setSports(sportsData as Sport[])
      } catch (error) {
        console.error("Error fetching data:", error)
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
  }, [user, toast, athleticId])

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
      console.error("Error registering athlete:", error)
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
      console.error("Error approving athlete:", error)
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
      console.error("Error rejecting athlete:", error)
      toast({
        title: "Erro na rejeição",
        description: "Não foi possível rejeitar o atleta.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue={isUserAthlete || userRole === "athletic" || userRole === "admin" ? "list" : "register"}>
        <TabsList>
          <TabsTrigger value="list">Lista de Atletas</TabsTrigger>
          {userRole === "buyer" && !isUserAthlete && <TabsTrigger value="register">Cadastrar como Atleta</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {athletes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  {userRole === "athletic"
                    ? "Sua atlética ainda não possui atletas cadastrados."
                    : "Não há atletas cadastrados."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {athletes.map((athlete) => (
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
                      <a
                        href={athlete.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:underline"
                      >
                        <User className="h-4 w-4 mr-1" />
                        Ver Foto
                      </a>
                      <a
                        href={athlete.enrollment_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Atestado
                      </a>
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

        {userRole === "buyer" && !isUserAthlete && (
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro de Atleta</CardTitle>
                <CardDescription>Preencha o formulário abaixo para se cadastrar como atleta no JISC.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAthleteRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="athletic">Atlética</Label>
                    <Select onValueChange={setSelectedAthleticId} value={selectedAthleticId || undefined}>
                      <SelectTrigger id="athletic">
                        <SelectValue placeholder="Selecione sua atlética" />
                      </SelectTrigger>
                      <SelectContent>
                        {athletics.map((athletic) => (
                          <SelectItem key={athletic.id} value={athletic.id}>
                            {athletic.name} - {athletic.university}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Foto com Documento (RG ou CNH)</Label>
                    <div className="flex items-center gap-4">
                      <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} required />
                      {photoFile && (
                        <div className="text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Arquivo selecionado
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Envie uma foto sua segurando seu documento de identidade.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enrollment">Atestado de Matrícula</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="enrollment"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleEnrollmentChange}
                        required
                      />
                      {enrollmentFile && (
                        <div className="text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Arquivo selecionado
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Envie um documento que comprove sua matrícula na instituição de ensino.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Modalidades</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {sports.map((sport) => (
                        <div
                          key={sport.id}
                          className={`
                            flex items-center p-2 rounded-md border cursor-pointer
                            ${selectedSports.includes(sport.id) ? "border-[#0456FC] bg-blue-50" : "border-gray-200"}
                          `}
                          onClick={() => handleSportToggle(sport.id)}
                        >
                          <div
                            className={`
                            w-4 h-4 rounded-sm mr-2 flex items-center justify-center
                            ${selectedSports.includes(sport.id) ? "bg-[#0456FC]" : "border border-gray-300"}
                          `}
                          >
                            {selectedSports.includes(sport.id) && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm">
                            {sport.name}
                            <span className="text-xs text-gray-500 ml-1">
                              ({sport.type === "sport" ? "Esporte" : "Boteco"})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    {selectedSports.length === 0 && (
                      <p className="text-xs text-red-500">Selecione pelo menos uma modalidade.</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#0456FC]"
                    disabled={
                      isSubmitting ||
                      !photoFile ||
                      !enrollmentFile ||
                      !selectedAthleticId ||
                      selectedSports.length === 0
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Cadastro
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

