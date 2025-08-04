"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { PixDisplay } from "@/components/pix-display"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Calendar, Check, CreditCard, DollarSign, Package, User, X } from "lucide-react"
import { useEffect, useState } from "react"

type PackageType = {
  id: string
  name: string
  description: string
  price: number
  category: "games" | "party" | "combined"
  includes_party: boolean
  includes_games: boolean
  discount_percentage: number | null
}

type AthletePackage = {
  id: string
  athlete_id: string
  package_id: string
  payment_status: "pending" | "completed" | "refunded"
  payment_date: string | null
  created_at: string
  updated_at: string
  package: PackageType
  athlete: {
    user_id: string
    athletic_id: string
    user: {
      name: string
      email: string
    }
    athletic?: {
      name: string
      pix_code: string | null
      pix_approved: boolean | null
    }
  }
}

type Athlete = {
  id: string
  user_id: string
  user: {
    name: string
    email: string
  }
}

type Athletic = {
  id: string
  name: string
  pix_code: string | null
  pix_approved: boolean | null
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [packages, setPackages] = useState<PackageType[]>([])
  const [athletePackages, setAthletePackages] = useState<AthletePackage[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [athletic, setAthletic] = useState<Athletic | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<AthletePackage | null>(null)
  const [showPixDialog, setShowPixDialog] = useState(false)

  // For package assignment
  const [formData, setFormData] = useState({
    athleteId: "",
    packageId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

        // Fetch packages
        const { data: packagesData, error: packagesError } = await supabase.from("packages").select("*").order("price")

        if (packagesError) throw packagesError
        setPackages(packagesData as PackageType[])

        // Fetch athlete packages based on role
        let query = supabase
          .from("athlete_packages")
          .select(`
            *,
            package:packages(*),
            athlete:athletes(
              user_id,
              athletic_id,
              user:users(name, email),
              athletic:athletics(name, pix_code, pix_approved)
            )
          `)
          .order("created_at", { ascending: false })

        if (userData.role === "athlete") {
          // Get athlete ID
          const { data: athleteData, error: athleteError } = await supabase
            .from("athletes")
            .select("id, athletic_id")
            .eq("user_id", user.id)
            .single()

          if (athleteError) throw athleteError
          query = query.eq("athlete_id", athleteData.id)

          // Get athletic data for the athlete
          const { data: athleticData, error: athleticError } = await supabase
            .from("athletics")
            .select("id, name, pix_code, pix_approved")
            .eq("id", athleteData.athletic_id)
            .single()

          if (!athleticError && athleticData) {
            setAthletic(athleticData as Athletic)
          }
        } else if (userData.role === "athletic") {
          // Get athletes from this athletic
          const { data: athletesData, error: athletesError } = await supabase
            .from("athletes")
            .select("id")
            .eq("athletic_id", user.id)

          if (athletesError) throw athletesError

          if (athletesData.length > 0) {
            const athleteIds = athletesData.map((a) => a.id)
            query = query.in("athlete_id", athleteIds)
          } else {
            // No athletes in this athletic
            setAthletePackages([])
            setIsLoading(false)
            return
          }

          // Get athletic data
          const { data: athleticData, error: athleticError } = await supabase
            .from("athletics")
            .select("id, name, pix_code, pix_approved")
            .eq("id", user.id)
            .single()

          if (!athleticError && athleticData) {
            setAthletic(athleticData as Athletic)
          }
        }

        const { data: packagesData2, error: packagesError2 } = await query
        if (packagesError2) throw packagesError2
        setAthletePackages(packagesData2 as AthletePackage[])

        // If admin or athletic, fetch athletes for assignment
        if (userData.role === "admin" || userData.role === "athletic") {
          let athletesQuery = supabase
            .from("athletes")
            .select(`
              id,
              user_id,
              user:users(name, email)
            `)
            .eq("status", "approved")

          if (userData.role === "athletic") {
            athletesQuery = athletesQuery.eq("athletic_id", user.id)
          }

          const { data: athletesData, error: athletesError } = await athletesQuery
          if (athletesError) throw athletesError
          setAthletes(athletesData.map(athlete => ({
            id: athlete.id,
            user_id: athlete.user_id,
            user: athlete.user[0]
          })))
        }
      } catch (error) {
        console.warn("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os pacotes.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAssignPackage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.athleteId || !formData.packageId) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, selecione um atleta e um pacote.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Check if athlete already has this package
      const { data: existingData, error: existingError } = await supabase
        .from("athlete_packages")
        .select("id")
        .eq("athlete_id", formData.athleteId)
        .eq("package_id", formData.packageId)
        .maybeSingle()

      if (existingError) throw existingError

      if (existingData) {
        toast({
          title: "Pacote já atribuído",
          description: "Este atleta já possui este pacote.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Get package price
      const selectedPackage = packages.find((p) => p.id === formData.packageId)

      // Assign package
      const { data: assignData, error: assignError } = await supabase
        .from("athlete_packages")
        .insert({
          athlete_id: formData.athleteId,
          package_id: formData.packageId,
          payment_status: "pending",
        })
        .select()

      if (assignError) throw assignError

      toast({
        title: "Pacote atribuído com sucesso",
        description: "O pacote foi atribuído ao atleta.",
      })

      // Reset form and close dialog
      setFormData({
        athleteId: "",
        packageId: "",
      })
      setIsDialogOpen(false)

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.warn("Error assigning package:", error)
      toast({
        title: "Erro ao atribuir pacote",
        description: "Não foi possível atribuir o pacote ao atleta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePaymentStatus = async (id: string, status: "completed" | "refunded") => {
    try {
      const { error } = await supabase
        .from("athlete_packages")
        .update({
          payment_status: status,
          payment_date: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", id)

      if (error) throw error

      toast({
        title: status === "completed" ? "Pagamento confirmado" : "Pagamento estornado",
        description:
          status === "completed" ? "O pagamento foi confirmado com sucesso." : "O pagamento foi estornado com sucesso.",
      })

      // Update local state
      setAthletePackages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              payment_status: status,
              payment_date: status === "completed" ? new Date().toISOString() : null,
            }
            : item,
        ),
      )
    } catch (error) {
      console.warn("Error updating payment status:", error)
      toast({
        title: "Erro ao atualizar pagamento",
        description: "Não foi possível atualizar o status do pagamento.",
        variant: "destructive",
      })
    }
  }

  const handleShowPixPayment = (pkg: AthletePackage) => {
    setSelectedPackage(pkg)
    setShowPixDialog(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "games":
        return <Badge className="bg-blue-500">Jogos</Badge>
      case "party":
        return <Badge className="bg-purple-500">Festa</Badge>
      case "combined":
        return <Badge className="bg-green-500">Combinado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <p className="text-gray-500">
            {userRole === "admin"
              ? "Gerencie os pagamentos de pacotes dos atletas."
              : userRole === "athletic"
                ? "Gerencie os pagamentos dos atletas da sua atlética."
                : "Visualize seus pagamentos de pacotes."}
          </p>
        </div>

        {(userRole === "admin" || userRole === "athletic") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0456FC]">
                <Package className="h-4 w-4 mr-2" />
                Atribuir Pacote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Atribuir Pacote a Atleta</DialogTitle>
                <DialogDescription>Selecione um atleta e um pacote para atribuir.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAssignPackage} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="athleteId">Atleta</label>
                  <Select
                    onValueChange={(value) => handleSelectChange("athleteId", value)}
                    value={formData.athleteId || undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um atleta" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.user.name} ({athlete.user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="packageId">Pacote</label>
                  <Select
                    onValueChange={(value) => handleSelectChange("packageId", value)}
                    value={formData.packageId || undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um pacote" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - {formatCurrency(pkg.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="submit" className="bg-[#0456FC]" disabled={isSubmitting}>
                    {isSubmitting ? "Atribuindo..." : "Atribuir Pacote"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Pacotes Disponíveis</TabsTrigger>
          <TabsTrigger value="payments">{userRole === "athlete" ? "Meus Pagamentos" : "Pagamentos"}</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          {packages.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Não há pacotes disponíveis no momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{pkg.name}</CardTitle>
                      {getCategoryBadge(pkg.category)}
                    </div>
                    <CardDescription>{pkg.description || "Sem descrição disponível."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(pkg.price)}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pkg.includes_games && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Jogos
                        </Badge>
                      )}
                      {pkg.includes_party && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Festa
                        </Badge>
                      )}
                      {pkg.discount_percentage && pkg.discount_percentage > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {pkg.discount_percentage}% de desconto
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {athletePackages.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  {userRole === "athlete"
                    ? "Você ainda não possui pacotes atribuídos."
                    : "Não há pagamentos para exibir."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {athletePackages.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{item.package.name}</CardTitle>
                      <Badge
                        className={
                          item.payment_status === "completed"
                            ? "bg-green-500"
                            : item.payment_status === "refunded"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }
                      >
                        {item.payment_status === "completed"
                          ? "Pago"
                          : item.payment_status === "refunded"
                            ? "Estornado"
                            : "Pendente"}
                      </Badge>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(item.package.category)}
                        <span>{item.package.description}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {userRole !== "athlete" && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{item.athlete.user.name}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{formatCurrency(item.package.price)}</span>
                    </div>
                    {item.payment_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Pago em: {formatDate(item.payment_date)}</span>
                      </div>
                    )}
                  </CardContent>

                  {(userRole === "admin" || userRole === "athletic") && item.payment_status === "pending" && (
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleUpdatePaymentStatus(item.id, "refunded")}
                      >
                        {" "}
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdatePaymentStatus(item.id, "completed")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirmar Pagamento
                      </Button>
                    </CardFooter>
                  )}

                  {userRole === "athlete" && item.payment_status === "pending" && (
                    <CardFooter>
                      <Button className="w-full bg-[#0456FC]" onClick={() => handleShowPixPayment(item)}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Realizar Pagamento
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* PIX Payment Dialog */}
      <Dialog open={showPixDialog} onOpenChange={setShowPixDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              Realize o pagamento do pacote {selectedPackage?.package.name} utilizando a chave PIX abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedPackage?.athlete.athletic?.pix_code && selectedPackage?.athlete.athletic?.pix_approved ? (
              <div className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm text-muted-foreground mb-2">Valor a pagar:</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedPackage.package.price)}</p>
                </div>

                <PixDisplay
                  pixKey={selectedPackage.athlete.athletic.pix_code}
                  athleticName={selectedPackage.athlete.athletic.name || "sua atlética"}
                />

                <div className="text-sm text-muted-foreground mt-2">
                  <p>Após realizar o pagamento, entre em contato com sua atlética para confirmar o pagamento.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-amber-600 mb-2">Chave PIX não disponível</p>
                <p className="text-sm text-muted-foreground">
                  A atlética ainda não cadastrou uma chave PIX ou a chave está aguardando aprovação. Entre em contato
                  com a atlética para obter informações sobre como realizar o pagamento.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPixDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
