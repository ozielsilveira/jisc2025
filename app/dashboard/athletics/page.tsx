"use client"


import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Building, Copy, Medal, School, Users } from "lucide-react"
import { useEffect, useState } from "react"

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
  const [referralLinks, setReferralLinks] = useState<{ [key: string]: string }>({})
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [registrationLink, setRegistrationLink] = useState("")

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

        if (userError) {
          console.error("Error fetching user role:", userError)
          throw userError
        }

        console.log("User role data:", userData)
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
          links[athletic.id] = `${window.location.origin}/register?type=athletic&athletic=${athletic.id}`
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

  const copyReferralLink = (athleticId: string) => {
    navigator.clipboard.writeText(referralLinks[athleticId])
    toast({
      title: "Link copiado",
      description: "Link de referência copiado para a área de transferência.",
    })
  }

  const openLinkDialog = () => {
    const link = `${window.location.origin}/register?type=athletic`
    setRegistrationLink(link)
    setIsLinkDialogOpen(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(registrationLink).then(() => {
      toast({
        title: "Link copiado",
        description: "Link de cadastro de atlética copiado para a área de transferência.",
      })
    }).catch((error) => {
      console.error("Erro ao copiar link:", error)
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link para a área de transferência.",
        variant: "destructive",
      })
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
        <p className="text-sm text-gray-400 mt-2">Role atual: {userRole || "Não definida"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Atléticas</h1>
          <p className="text-gray-500">Visualize as atléticas participantes do campeonato.</p>
        </div>
        <Button
          onClick={openLinkDialog}
          className="flex items-center gap-2"
        >
          <Building className="h-4 w-4" />
          Gerar Link de Cadastro
        </Button>
      </div>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Cadastro de Atlética</DialogTitle>
            <DialogDescription>
              Copie o link abaixo para compartilhar com a atlética que deseja cadastrar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Link de Cadastro</Label>
              <div className="flex items-center">
                <Input
                  value={registrationLink}
                  readOnly
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-[-40px]"
                  onClick={copyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        src={athletic.logo_url}
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

                <div className="space-y-2">
                  <Label>Link de Referência para Atléticas</Label>
                  <div className="flex items-center">
                    <Input
                      value={`${window.location.origin}/register?type=athletic&athletic=${athletic.id}`}
                      readOnly
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-[-40px]"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?type=athletic&athletic=${athletic.id}`)
                        toast({
                          title: "Link copiado",
                          description: "Link de referência para atlética copiado para a área de transferência.",
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Compartilhe este link para cadastro de novos membros da atlética.
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

