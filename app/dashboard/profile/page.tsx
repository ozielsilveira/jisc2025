"use client"

import React, { useEffect, useState } from "react"
import { CheckCircle, Clock, Upload } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

type UserProfile = {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  gender: string
  role: string
}

type Athletic = {
  id: string
  name: string
  university: string
}

type Sport = {
  id: string
  name: string
  type: "sport" | "boteco"
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAthleteRegistered, setIsAthleteRegistered] = useState(false)

  // Athlete registration state
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [selectedAthleticId, setSelectedAthleticId] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null)
  const [selectedSports, setSelectedSports] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) throw error
        setProfile(data as UserProfile)
        setFormData(data as UserProfile)

        if (data.role === "athlete") {
          const { data: athleteData, error: athleteError } = await supabase
            .from("athletes")
            .select("id")
            .eq("user_id", user.id)
            .single()

          if (athleteError && athleteError.code !== "PGRST116") {
            // PGRST116: "No rows found"
            throw athleteError
          }

          if (athleteData) {
            setIsAthleteRegistered(true)
          } else {
            // Fetch data needed for registration form
            fetchAthletics()
            fetchSports()
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, toast])

  const fetchAthletics = async () => {
    try {
      const { data, error } = await supabase.from("athletics").select("*")
      if (error) throw error
      setAthletics(data)
    } catch (error) {
      console.error("Error fetching athletics:", error)
      toast({
        title: "Erro ao carregar atléticas",
        description: "Não foi possível carregar a lista de atléticas.",
        variant: "destructive",
      })
    }
  }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: formData.name,
          phone: formData.phone,
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile((prev) => ({ ...prev!, ...formData }))
      setIsEditing(false)
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível salvar suas alterações.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile as UserProfile)
    setIsEditing(false)
  }

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
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    )
  }

  const handleAthleteRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !photoFile || !enrollmentFile || !selectedAthleticId || selectedSports.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do formulário.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload Photo
      const photoPath = `${user.id}/document_${photoFile.name}`
      const { error: photoError } = await supabase.storage.from("athlete-documents").upload(photoPath, photoFile)
      if (photoError) throw photoError

      // 2. Upload Enrollment
      const enrollmentPath = `${user.id}/enrollment_${enrollmentFile.name}`
      const { error: enrollmentError } = await supabase.storage
        .from("athlete-documents")
        .upload(enrollmentPath, enrollmentFile)
      if (enrollmentError) throw enrollmentError

      // 3. Get public URLs
      const { data: photoUrlData } = supabase.storage.from("athlete-documents").getPublicUrl(photoPath)
      const { data: enrollmentUrlData } = supabase.storage.from("athlete-documents").getPublicUrl(enrollmentPath)

      // 4. Create Athlete Record
      const { data: athleteData, error: athleteInsertError } = await supabase
        .from("athletes")
        .insert({
          user_id: user.id,
          athletic_id: selectedAthleticId,
          document_photo_url: photoUrlData.publicUrl,
          enrollment_proof_url: enrollmentUrlData.publicUrl,
          status: "pending", // or 'approved' depending on your workflow
        })
        .select("id")
        .single()

      if (athleteInsertError) throw athleteInsertError

      // 5. Link Sports to Athlete
      const athleteSports = selectedSports.map((sportId) => ({
        athlete_id: athleteData.id,
        sport_id: sportId,
      }))

      const { error: sportsError } = await supabase.from("athlete_sports").insert(athleteSports)
      if (sportsError) throw sportsError

      toast({
        title: "Cadastro enviado com sucesso!",
        description: "Seu cadastro de atleta foi enviado e está aguardando aprovação.",
      })
      setIsAthleteRegistered(true)
    } catch (error: any) {
      console.error("Error during athlete registration:", error)
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível concluir o seu cadastro de atleta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-gray-500">Visualize e edite suas informações pessoais.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Seus dados cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ... (personal info fields) */}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
          )}
        </CardFooter>
      </Card>

      {profile?.role === "athlete" && (
        <Tabs defaultValue="register" className="w-full">
          <TabsContent value="register">
            {isAthleteRegistered ? (
              <Card>
                <CardHeader>
                  <CardTitle>Atestado de Matrícula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-md border border-dashed p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <h3 className="text-2xl font-bold">Tudo Certo!</h3>
                    <p className="text-gray-500">
                      Seu atestado de matrícula foi enviado com sucesso e está em análise.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
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
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

