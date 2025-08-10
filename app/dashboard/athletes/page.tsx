"use client"

import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  FileText,
  Share2,
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Trophy,
  MapPin,
  Eye,
  UserCheck,
  UserX,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  Star,
  MessageCircle,
} from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"

// Types
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

type Package = {
  id: string
  name: string
  price: number
  description: string
}

type ViewMode = "grid" | "list"
type SortField = "name" | "created_at" | "status" | "athletic"
type SortOrder = "asc" | "desc"

// Utility function to format WhatsApp message
const formatWhatsAppMessage = (athleteName: string, packageName: string, packagePrice: number): string => {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(packagePrice)

  return `Olá ${athleteName}, você adquiriu o pacote ${packageName} no valor ${formattedPrice}, abaixo temos nossos métodos de pagamentos:`
}

// Utility function to create WhatsApp URL
const createWhatsAppUrl = (phoneNumber: string, message: string): string => {
  // Remove all non-numeric characters from phone number
  const cleanPhone = phoneNumber.replace(/\D/g, "")

  // Add country code if not present (assuming Brazil +55)
  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

// Custom Hooks
const useAthletes = (user: any, userRole: string | null) => {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [athleticId, setAthleticId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const fetchData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // Fetch athletic ID for athletic users
      let athleticIdForQuery: string | null = null
      if (userRole === "athletic") {
        const { data: athleticData } = await supabase
          .from("athletics")
          .select("id")
          .eq("representative_id", user.id)
          .maybeSingle()
        if (athleticData) {
          athleticIdForQuery = athleticData.id
          setAthleticId(athleticData.id)
        }
      }

      // Build athletes query
      const athletesQuery = supabase
        .from("athletes")
        .select(
          `
          *,
          user:users(name, email, cpf, phone, gender),
          athletic:athletics(name),
          athlete_sports(
            sport:sports(id, name, type)
          )
        `,
        )
        .order("created_at", { ascending: false })

      // Apply role-based filters
      if (userRole === "admin") {
        const athleticFilter = searchParams.get("athletic")
        if (athleticFilter && athleticFilter !== "all") {
          athletesQuery.eq("athletic_id", athleticFilter)
        }
      } else if (userRole === "athletic" && athleticIdForQuery) {
        athletesQuery.eq("athletic_id", athleticIdForQuery)
      }

      const { data: athletesData, error: athletesError } = await athletesQuery
      if (athletesError) throw athletesError

      // Format athletes data
      const formattedAthletes = athletesData.map((athlete) => ({
        ...athlete,
        sports: athlete.athlete_sports?.map((as: any) => as.sport) || [],
      }))
      setAthletes(formattedAthletes as Athlete[])

      // Fetch athletics for admin users
      if (userRole === "admin") {
        const { data: athleticsData, error: athleticsError } = await supabase
          .from("athletics")
          .select("id, name, university")
          .order("name")
        if (athleticsError) throw athleticsError
        setAthletics(athleticsData as Athletic[])
      }

      // Fetch sports
      const { data: sportsData, error: sportsError } = await supabase
        .from("sports")
        .select("id, name, type")
        .order("name")
      if (sportsError) throw sportsError
      setSports(sportsData as Sport[])

      // Fetch packages (assuming you have a packages table)
      try {
        const { data: packagesData, error: packagesError } = await supabase
          .from("packages")
          .select("id, name, price, description")
          .order("name")
        if (packagesError) {
          console.warn("Packages table not found, using mock data")
          // Mock packages data if table doesn't exist
          setPackages([
            { id: "1", name: "Pacote Básico", price: 50.0, description: "Pacote básico de participação" },
            { id: "2", name: "Pacote Premium", price: 100.0, description: "Pacote premium com benefícios extras" },
            { id: "3", name: "Pacote VIP", price: 150.0, description: "Pacote VIP com todos os benefícios" },
          ])
        } else {
          setPackages(packagesData as Package[])
        }
      } catch (error) {
        console.warn("Error fetching packages:", error)
        // Use mock data as fallback
        setPackages([
          { id: "1", name: "Pacote Básico", price: 50.0, description: "Pacote básico de participação" },
          { id: "2", name: "Pacote Premium", price: 100.0, description: "Pacote premium com benefícios extras" },
          { id: "3", name: "Pacote VIP", price: 150.0, description: "Pacote VIP com todos os benefícios" },
        ])
      }
    } catch (error) {
      console.warn("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, userRole, searchParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    athletes,
    setAthletes,
    athletics,
    sports,
    packages,
    isLoading,
    athleticId,
    refetch: fetchData,
  }
}

// Components
const AthleteAvatar = ({ athlete }: { athlete: Athlete }) => {
  const initials = athlete.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Avatar className="h-12 w-12">
      <AvatarImage src={`/placeholder-icon.png?height=48&width=48&text=${initials}`} alt={athlete.user.name} />
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

const StatusBadge = ({ status }: { status: Athlete["status"] }) => {
  const statusConfig = {
    approved: { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-200" },
    rejected: { label: "Rejeitado", className: "bg-red-100 text-red-800 border-red-200" },
    pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    sent: { label: "Em Análise", className: "bg-blue-100 text-blue-800 border-blue-200" },
  }

  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {config.label}
    </Badge>
  )
}

const SportsBadges = ({ sports }: { sports: Athlete["sports"] }) => {
  if (!sports.length) return null

  return (
    <div className="flex flex-wrap gap-1">
      {sports.slice(0, 3).map((sport) => (
        <Badge
          key={sport.id}
          variant="secondary"
          className={`text-xs ${
            sport.type === "sport"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-purple-50 text-purple-700 border-purple-200"
          }`}
        >
          {sport.name}
        </Badge>
      ))}
      {sports.length > 3 && (
        <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600">
          +{sports.length - 3}
        </Badge>
      )}
    </div>
  )
}

// WhatsApp Package Selection Dialog
const WhatsAppPackageDialog = ({
  athlete,
  packages,
  isOpen,
  onClose,
}: {
  athlete: Athlete | null
  packages: Package[]
  isOpen: boolean
  onClose: () => void
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string>("")

  const handleSendWhatsApp = () => {
    if (!athlete || !selectedPackage) return

    const packageData = packages.find((p) => p.id === selectedPackage)
    if (!packageData) return

    const message = formatWhatsAppMessage(athlete.user.name, packageData.name, packageData.price)
    const whatsappUrl = createWhatsAppUrl(athlete.user.phone, message)

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span>Enviar WhatsApp</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {athlete && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Enviando para:</p>
              <p className="font-semibold">{athlete.user.name}</p>
              <p className="text-sm text-gray-500">{athlete.user.phone}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Selecione o pacote:</label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um pacote" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{pkg.name}</span>
                      <span className="text-sm text-gray-500">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(pkg.price)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPackage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium mb-2">Prévia da mensagem:</p>
              <p className="text-sm text-green-700">
                {formatWhatsAppMessage(
                  athlete?.user.name || "",
                  packages.find((p) => p.id === selectedPackage)?.name || "",
                  packages.find((p) => p.id === selectedPackage)?.price || 0,
                )}
              </p>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={!selectedPackage}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const AthleteGridCard = ({
  athlete,
  userRole,
  onViewDocument,
  onApprove,
  onReject,
  onWhatsApp,
}: {
  athlete: Athlete
  userRole: string | null
  onViewDocument: (url: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onWhatsApp: (athlete: Athlete) => void
}) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <AthleteAvatar athlete={athlete} />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{athlete.user.name}</h3>
              <p className="text-sm text-gray-500 truncate">{athlete.athletic.name}</p>
            </div>
          </div>
          <StatusBadge status={athlete.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center text-gray-500">
              <Mail className="h-4 w-4 mr-1" />
              <span className="truncate">{athlete.user.email}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Phone className="h-4 w-4 mr-1" />
              <span>{athlete.user.phone}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{new Date(athlete.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Trophy className="h-4 w-4 mr-1" />
              <span>{athlete.sports.length} modalidades</span>
            </div>
          </div>
        </div>
        <SportsBadges sports={athlete.sports} />
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDocument(athlete.cnh_cpf_document_url)}
            disabled={!athlete.cnh_cpf_document_url}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Documentos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDocument(athlete.enrollment_document_url)}
            disabled={!athlete.enrollment_document_url}
            className="flex-1"
          >
            <FileText className="h-4 w-4 mr-1" />
            Matrícula
          </Button>
        </div>
        {/* WhatsApp Button for Athletic users */}
        {userRole === "athletic" && athlete.status === "approved" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWhatsApp(athlete)}
            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar WhatsApp
          </Button>
        )}
      </CardContent>
      {(userRole === "admin" || userRole === "athletic") && athlete.status === "sent" && (
        <CardFooter className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(athlete.id)}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <UserX className="h-4 w-4 mr-1" />
            Rejeitar
          </Button>
          <Button size="sm" onClick={() => onApprove(athlete.id)} className="flex-1 bg-green-600 hover:bg-green-700">
            <UserCheck className="h-4 w-4 mr-1" />
            Aprovar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

const AthleteListItem = ({
  athlete,
  userRole,
  onViewDocument,
  onApprove,
  onReject,
  onWhatsApp,
}: {
  athlete: Athlete
  userRole: string | null
  onViewDocument: (url: string) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onWhatsApp: (athlete: Athlete) => void
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <AthleteAvatar athlete={athlete} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">{athlete.user.name}</h3>
                <StatusBadge status={athlete.status} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{athlete.athletic.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{athlete.user.email}</span>
                </div>
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{athlete.sports.length} modalidades</span>
                </div>
              </div>
              <div className="mt-2">
                <SportsBadges sports={athlete.sports} />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDocument(athlete.cnh_cpf_document_url)}
              disabled={!athlete.cnh_cpf_document_url}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {/* WhatsApp Button for Athletic users */}
            {userRole === "athletic" && athlete.status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWhatsApp(athlete)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            {(userRole === "admin" || userRole === "athletic") && athlete.status === "sent" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(athlete.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <UserX className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => onApprove(athlete.id)} className="bg-green-600 hover:bg-green-700">
                  <UserCheck className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const EmptyState = ({ userRole }: { userRole: string | null }) => (
  <div className="text-center py-16">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
      <Users className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {userRole === "athletic" ? "Nenhum atleta cadastrado" : "Nenhum atleta encontrado"}
    </h3>
    <p className="text-gray-500 max-w-md mx-auto">
      {userRole === "athletic"
        ? "Compartilhe o link de cadastro para começar a montar sua equipe!"
        : "Tente ajustar os filtros para encontrar os atletas que procura."}
    </p>
  </div>
)

const LoadingState = () => (
  <div className="flex items-center justify-center py-16">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-gray-500">Carregando atletas...</p>
    </div>
  </div>
)

// Main Component
export default function AthletesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isUserAthlete, setIsUserAthlete] = useState(false)

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAthleticFilter, setSelectedAthleticFilter] = useState("all")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")
  const [selectedSportFilter, setSelectedSportFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // Document Dialog
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [documentUrl, setDocumentUrl] = useState("")

  // WhatsApp Dialog
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)

  const { athletes, setAthletes, athletics, sports, packages, isLoading, athleticId, refetch } = useAthletes(
    user,
    userRole,
  )

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return
      try {
        const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
        if (userData) {
          setUserRole(userData.role)
        }
        // Check if user is athlete
        const { data: athleteData } = await supabase.from("athletes").select("id").eq("user_id", user.id).maybeSingle()
        setIsUserAthlete(!!athleteData)
      } catch (error) {
        console.warn("Error fetching user role:", error)
      }
    }
    fetchUserRole()
  }, [user])

  // Filtered and sorted athletes
  const filteredAndSortedAthletes = useMemo(() => {
    const filtered = athletes.filter((athlete) => {
      const matchesSearch =
        athlete.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAthletic = selectedAthleticFilter === "all" || athlete.athletic_id === selectedAthleticFilter
      const matchesStatus = selectedStatusFilter === "all" || athlete.status === selectedStatusFilter
      const matchesSport =
        selectedSportFilter === "all" || athlete.sports.some((sport) => sport.id === selectedSportFilter)

      return matchesSearch && matchesAthletic && matchesStatus && matchesSport
    })

    // Sort athletes
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      switch (sortField) {
        case "name":
          aValue = a.user.name.toLowerCase()
          bValue = b.user.name.toLowerCase()
          break
        case "created_at":
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "athletic":
          aValue = a.athletic.name.toLowerCase()
          bValue = b.athletic.name.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [athletes, searchTerm, selectedAthleticFilter, selectedStatusFilter, selectedSportFilter, sortField, sortOrder])

  // Handlers
  const handleApproveAthlete = async (athleteId: string) => {
    try {
      const { error } = await supabase.from("athletes").update({ status: "approved" }).eq("id", athleteId)
      if (error) throw error
      setAthletes((prev) =>
        prev.map((athlete) => (athlete.id === athleteId ? { ...athlete, status: "approved" } : athlete)),
      )
      toast({
        title: "Atleta aprovado",
        description: "O atleta foi aprovado com sucesso.",
      })
    } catch (error) {
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
      setAthletes((prev) =>
        prev.map((athlete) => (athlete.id === athleteId ? { ...athlete, status: "rejected" } : athlete)),
      )
      toast({
        title: "Atleta rejeitado",
        description: "O atleta foi rejeitado.",
      })
    } catch (error) {
      toast({
        title: "Erro na rejeição",
        description: "Não foi possível rejeitar o atleta.",
        variant: "destructive",
      })
    }
  }

  const handleShareLink = async () => {
    if (!athleticId) return
    try {
      const link = `${window.location.origin}/register?type=athlete&athletic=${athleticId}`
      await navigator.clipboard.writeText(link)
      toast({
        title: "Link copiado!",
        description: "O link de cadastro foi copiado para a área de transferência.",
      })
    } catch (error) {
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleViewDocument = (url: string) => {
    setDocumentUrl(url)
    setDocumentDialogOpen(true)
  }

  const handleWhatsApp = (athlete: Athlete) => {
    setSelectedAthlete(athlete)
    setWhatsappDialogOpen(true)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Atletas</h1>
          <p className="text-gray-600">
            {userRole === "admin"
              ? "Gerencie todos os atletas do campeonato."
              : userRole === "athletic"
                ? "Gerencie os atletas da sua atlética."
                : "Cadastre-se como atleta ou veja seu status."}
          </p>
        </div>
        {/* Header Actions */}
        <div className="flex items-center space-x-3">
          {userRole === "athletic" && (
            <Button onClick={handleShareLink} className="bg-blue-600 hover:bg-blue-700">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar Link
            </Button>
          )}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {userRole === "athletic" || userRole === "admin" ? (
        <div className="space-y-6">
          {/* Filters and Search */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {userRole === "admin" && (
                    <Select value={selectedAthleticFilter} onValueChange={setSelectedAthleticFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as Atléticas" />
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
                  <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="sent">Em Análise</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                      <SelectItem value="rejected">Rejeitados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedSportFilter} onValueChange={setSelectedSportFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as Modalidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Modalidades</SelectItem>
                      {sports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-") as [SortField, SortOrder]
                      setSortField(field)
                      setSortOrder(order)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                      <SelectItem value="created_at-desc">Mais Recentes</SelectItem>
                      <SelectItem value="created_at-asc">Mais Antigos</SelectItem>
                      <SelectItem value="status-asc">Status</SelectItem>
                      <SelectItem value="athletic-asc">Atlética</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Results count */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {filteredAndSortedAthletes.length} atleta{filteredAndSortedAthletes.length !== 1 ? "s" : ""}{" "}
                    encontrado{filteredAndSortedAthletes.length !== 1 ? "s" : ""}
                  </span>
                  {(searchTerm ||
                    selectedAthleticFilter !== "all" ||
                    selectedStatusFilter !== "all" ||
                    selectedSportFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedAthleticFilter("all")
                        setSelectedStatusFilter("all")
                        setSelectedSportFilter("all")
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Athletes List */}
          {filteredAndSortedAthletes.length === 0 ? (
            <EmptyState userRole={userRole} />
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredAndSortedAthletes.map((athlete) =>
                viewMode === "grid" ? (
                  <AthleteGridCard
                    key={athlete.id}
                    athlete={athlete}
                    userRole={userRole}
                    onViewDocument={handleViewDocument}
                    onApprove={handleApproveAthlete}
                    onReject={handleRejectAthlete}
                    onWhatsApp={handleWhatsApp}
                  />
                ) : (
                  <AthleteListItem
                    key={athlete.id}
                    athlete={athlete}
                    userRole={userRole}
                    onViewDocument={handleViewDocument}
                    onApprove={handleApproveAthlete}
                    onReject={handleRejectAthlete}
                    onWhatsApp={handleWhatsApp}
                  />
                ),
              )}
            </div>
          )}
        </div>
      ) : (
        <Tabs defaultValue={isUserAthlete ? "list" : "register"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Meus Dados de Atleta</TabsTrigger>
            {!isUserAthlete && <TabsTrigger value="register">Cadastrar como Atleta</TabsTrigger>}
          </TabsList>
          <TabsContent value="list" className="mt-6">
            {isUserAthlete ? (
              <div className="space-y-4">
                {filteredAndSortedAthletes.map((athlete) => (
                  <AthleteGridCard
                    key={athlete.id}
                    athlete={athlete}
                    userRole={userRole}
                    onViewDocument={handleViewDocument}
                    onApprove={handleApproveAthlete}
                    onReject={handleRejectAthlete}
                    onWhatsApp={handleWhatsApp}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Você ainda não é um atleta registrado.</p>
              </div>
            )}
          </TabsContent>
          {!isUserAthlete && (
            <TabsContent value="register" className="mt-6">
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Formulário de cadastro de atleta seria implementado aqui.</p>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Document Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizador de Documento</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex-1 min-h-0">
            {documentUrl ? (
              <div className="w-full h-[70vh]">
                <iframe src={documentUrl} className="w-full h-full border rounded-md" title="Documento" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Documento não encontrado.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Package Dialog */}
      <WhatsAppPackageDialog
        athlete={selectedAthlete}
        packages={packages}
        isOpen={whatsappDialogOpen}
        onClose={() => {
          setWhatsappDialogOpen(false)
          setSelectedAthlete(null)
        }}
      />
    </div>
  )
}
