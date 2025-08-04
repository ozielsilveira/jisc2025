"use client"

import React, { useEffect, useState } from "react"
import { CheckCircle, Clock, Upload } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
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

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [athleteStatus, setAthleteStatus] = useState<"pending" | "sent" | "approved" | "rejected" | null>(null)

  // Athlete registration state
  const [sports, setSports] = useState<Sport[]>([])
  const [enrollmentFile, setEnrollmentFile] = useState<File | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
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
            .select("*")
            .eq("user_id", user.id)
            .single()

          if (athleteError && athleteError.code !== "PGRST116") {
            throw athleteError
          }

          if (athleteData) {
            setAthlete(athleteData)
            setAthleteStatus(athleteData.status)
            if (athleteData.status === "rejected" || !athleteData.status) {
              fetchSports()
            }
          } else {
            setAthleteStatus(null)
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

  const handleEnrollmentChange = (file: File | null) => {
    setEnrollmentFile(file)
  }

  const handleDocumentChange = (file: File | null) => {
    setDocumentFile(file)
  }

  const handleSportToggle = (sportId: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    )
  }

  const handleAthleteRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    const hasValidation =
      (!documentFile && !athlete?.cnh_cpf_document_url) ||
      (!enrollmentFile && !athlete?.enrollment_document_url) ||
      selectedSports.length === 0

    if (hasValidation) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do formulário antes de enviar.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const uploadFile = async (file: File, name: string) => {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${name}_${Date.now()}.${fileExt}`
      
      // Upload do arquivo usando o cliente autenticado
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Erro ao fazer upload do arquivo:', uploadError)
        throw uploadError
      }
      
      // Obtém a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)
      
      return publicUrl
    }

    try {
      let documentUrl = athlete?.cnh_cpf_document_url
      if (documentFile) {
        documentUrl = await uploadFile(documentFile, "document")
      }

      let enrollmentUrl = athlete?.enrollment_document_url
      if (enrollmentFile) {
        enrollmentUrl = await uploadFile(enrollmentFile, "enrollment")
      }

      if (athlete) {
        // Update existing athlete
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
      } else {
        // Create new athlete
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

      {profile?.role === "athlete" && (
        <Tabs defaultValue="register" className="w-full">
          <TabsContent value="register">
            {athleteStatus === "approved" && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos Aprovados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-md border border-dashed p-8 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <h3 className="text-2xl font-bold">Tudo Certo!</h3>
                    <p className="text-gray-500">Seus documentos foram aprovados. Bem-vindo ao time!</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {(athleteStatus === "pending" || athleteStatus === "sent") && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos em Análise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center space-y-4 rounded-md border border-dashed p-8 text-center">
                    <Clock className="h-16 w-16 text-yellow-500" />
                    <h3 className="text-2xl font-bold">Aguardando Aprovação</h3>
                    <p className="text-gray-500">
                      Seus documentos foram enviados e estão em análise. Avisaremos quando o processo for concluído.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {(athleteStatus === "rejected" || athleteStatus === null) && (
              <Card>
                <CardHeader>
                  <CardTitle>Cadastro de Atleta</CardTitle>
                  <CardDescription>
                    {athleteStatus === "rejected" && (
                      <p className="text-red-700 bg-red-100 border border-red-400 rounded-md p-3 my-4">
                        Seu cadastro foi rejeitado. Por favor, verifique os arquivos e envie-os novamente.
                      </p>
                    )}
                    Para concluir seu cadastro como atleta, precisamos de alguns documentos. Envie os arquivos abaixo para
                    análise.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAthleteRegistration} className="space-y-8">
                    <FileUpload
                      id="document"
                      label="Documento com Foto (CNH ou CPF)"
                      description="Envie uma foto ou PDF do seu documento de identidade (frente e verso)."
                      existingFileUrl={athlete?.cnh_cpf_document_url}
                      onFileChange={handleDocumentChange}
                      required={!athlete?.cnh_cpf_document_url}
                    />

                    <FileUpload
                      id="enrollment"
                      label="Atestado de Matrícula"
                      description="O atestado deve ser recente e comprovar sua matrícula na instituição de ensino."
                      existingFileUrl={athlete?.enrollment_document_url}
                      onFileChange={handleEnrollmentChange}
                      required={!athlete?.enrollment_document_url}
                    />

                    <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="text-lg font-semibold">Modalidades</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {sports.map((sport) => (
                          <div
                            key={sport.id}
                            className={`
                              flex items-center p-3 rounded-lg border cursor-pointer transition-all
                              ${
                                selectedSports.includes(sport.id)
                                  ? "border-[#0456FC] bg-blue-50 shadow-md"
                                  : "border-gray-200 hover:bg-gray-50"
                              }
                            `}
                            onClick={() => handleSportToggle(sport.id)}
                          >
                            <div
                              className={`
                                w-5 h-5 rounded-md mr-3 flex items-center justify-center
                                ${selectedSports.includes(sport.id) ? "bg-[#0456FC]" : "border border-gray-300"}
                              `}
                            >
                              {selectedSports.includes(sport.id) && <CheckCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{sport.name}</span>
                              <span className="text-xs text-gray-500">
                                ({sport.type === "sport" ? "Esporte" : "Boteco"})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedSports.length === 0 && (
                        <p className="text-xs text-red-500 mt-2">Selecione pelo menos uma modalidade.</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#0456FC] hover:bg-[#0345D1] text-white font-bold py-3"
                      disabled={
                        isSubmitting ||
                        (!documentFile && !athlete?.cnh_cpf_document_url) ||
                        (!enrollmentFile && !athlete?.enrollment_document_url) ||
                        selectedSports.length === 0
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="h-5 w-5 mr-2 animate-spin" />
                          Enviando Documentos...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          Enviar e Finalizar Cadastro
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

