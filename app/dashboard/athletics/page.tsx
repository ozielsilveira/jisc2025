"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { Building, Copy, Medal, Plus, School, Users } from "lucide-react"

type Athletic = {
  id: string
  name: string
  logo_url: string
  university: string
  created_at: string
  updated_at: string
  _count?: {
    athletes: number
  }
}

export default function AthleticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // For athletic creation
  const [formData, setFormData] = useState({
    name: "",
    university: "",
    logoFile: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referralLinks, setReferralLinks] = useState<{ [key: string]: string }>({})

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

        // Fetch athletics
        const { data: athleticsData, error: athleticsError } = await supabase
          .from("athletics")
          .select("*")
          .order("name")

        if (athleticsError) throw athleticsError

        // Get athlete counts for each athletic
        const athleticsWithCounts = await Promise.all(
          athleticsData.map(async (athletic) => {
            const { count, error } = await supabase
              .from("athletes")
              .select("*", { count: "exact", head: true })
              .eq("athletic_id", athletic.id)

            return {
              ...athletic,
              _count: {
                athletes: count || 0,
              },
            }
          }),
        )

        setAthletics(athleticsWithCounts as Athletic[])

        // Generate referral links
        const links: { [key: string]: string } = {}
        athleticsData.forEach((athletic) => {
          links[athletic.id] = `${window.location.origin}/register?type=athlete&athletic=${athletic.id}`
        })
        setReferralLinks(links)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as atléticas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, logoFile: e.target.files![0] }))
    }
  }

  const handleCreateAthletic = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.university) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let logoUrl = ""

      // Upload logo if provided
      if (formData.logoFile) {
        const fileName = `athletic-logo-${Date.now()}`
        const { data: fileData, error: fileError } = await supabase.storage
          .from("athletic-logos")
          .upload(fileName, formData.logoFile)

        if (fileError) throw fileError

        // Get logo URL
        const { data: urlData } = supabase.storage.from("athletic-logos").getPublicUrl(fileName)

        logoUrl = urlData.publicUrl
      } else {
        // Use a placeholder logo
        logoUrl = "/placeholder.svg?height=200&width=200"
      }

      // Create athletic
      const { data: athleticData, error: athleticError } = await supabase
        .from("athletics")
        .insert({
          name: formData.name,
          university: formData.university,
          logo_url: logoUrl,
        })
        .select()

      if (athleticError) throw athleticError

      toast({
        title: "Atlética criada com sucesso",
        description: "A atlética foi adicionada ao sistema.",
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        university: "",
        logoFile: null,
      })
      setIsDialogOpen(false)

      // Refresh the athletics list
      window.location.reload()
    } catch (error) {
      console.error("Error creating athletic:", error)
      toast({
        title: "Erro ao criar atlética",
        description: "Não foi possível adicionar a atlética ao sistema.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyReferralLink = (athleticId: string) => {
    navigator.clipboard.writeText(referralLinks[athleticId])
    toast({
      title: "Link copiado",
      description: "Link de referência copiado para a área de transferência.",
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]"></div>
      </div>
    )
  }

  // Only admin can access this page
  if (userRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
        <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Atléticas</h1>
          <p className="text-gray-500">Gerencie as atléticas participantes do campeonato.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0456FC]">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atlética
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Atlética</DialogTitle>
              <DialogDescription>
                Preencha os detalhes para cadastrar uma nova atlética no campeonato.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAthletic} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Atlética</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Atlética Medicina"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">Universidade</Label>
                <Input
                  id="university"
                  name="university"
                  value={formData.university}
                  onChange={handleInputChange}
                  placeholder="Ex: Universidade Federal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Atlética (opcional)</Label>
                <Input id="logo" name="logo" type="file" accept="image/*" onChange={handleFileChange} />
                <p className="text-xs text-gray-500">Recomendado: imagem quadrada com pelo menos 200x200 pixels.</p>
              </div>

              <DialogFooter>
                <Button type="submit" className="bg-[#0456FC]" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar Atlética"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {athletics.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Não há atléticas cadastradas no sistema.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {athletics.map((athletic) => (
            <Card key={athletic.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {athletic.logo_url ? (
                      <img
                        src={athletic.logo_url || "/placeholder.svg"}
                        alt={`Logo da ${athletic.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <CardTitle>{athletic.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <School className="h-4 w-4 mr-1" />
                      {athletic.university}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{athletic._count?.athletes || 0} atletas cadastrados</span>
                </div>

                <div className="space-y-2">
                  <Label>Link de Referência para Atletas</Label>
                  <div className="flex items-center">
                    <Input value={referralLinks[athletic.id] || ""} readOnly className="pr-10" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-[-40px]"
                      onClick={() => copyReferralLink(athletic.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Compartilhe este link com os atletas para que eles se cadastrem vinculados a esta atlética.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = `/dashboard/athletes?athletic=${athletic.id}`)}
                >
                  <Medal className="h-4 w-4 mr-2" />
                  Ver Atletas
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

