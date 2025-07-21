"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Plus, Trophy } from "lucide-react"

type Game = {
  id: string
  sport_id: string
  location: string
  start_time: string
  end_time: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  sport: {
    name: string
    type: string
  }
  participants: {
    athletic_id: string
    athletic: {
      name: string
    }
  }[]
}

type Sport = {
  id: string
  name: string
  type: "sport" | "bar_game"
}

type Athletic = {
  id: string
  name: string
}

export default function GamesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [games, setGames] = useState<Game[]>([])
  const [sports, setSports] = useState<Sport[]>([])
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // For game creation
  const [formData, setFormData] = useState({
    sportId: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    participants: [] as string[],
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

        // Fetch games with related data
        let query = supabase
          .from("games")
          .select(`
            *,
            sport:sports(*),
            participants:game_participants(
              athletic_id,
              athletic:athletics(name)
            )
          `)
          .order("start_time", { ascending: true })

        // If user is athlete, filter games by their sports
        if (userData.role === "athlete") {
          // Get athlete ID
          const { data: athleteData, error: athleteError } = await supabase
            .from("athletes")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          if (!athleteError && athleteData) {
            // Get athlete's sports
            const { data: sportData, error: sportError } = await supabase
              .from("athlete_sports")
              .select("sport_id")
              .eq("athlete_id", athleteData.id)

            if (!sportError && sportData && sportData.length > 0) {
              const sportIds = sportData.map((s) => s.sport_id)
              query = query.in("sport_id", sportIds)
            }
          }
        }

        // If user is athletic, filter games by their athletic
        if (userData.role === "athletic") {
          query = query.filter("participants.athletic_id", "eq", user.id)
        }

        const { data: gamesData, error: gamesError } = await query

        if (gamesError) throw gamesError
        setGames(gamesData as Game[])

        // Fetch sports for dropdown
        const { data: sportsData, error: sportsError } = await supabase
          .from("sports")
          .select("id, name, type")
          .order("name")

        if (sportsError) throw sportsError
        setSports(sportsData as Sport[])

        // Fetch athletics for dropdown
        const { data: athleticsData, error: athleticsError } = await supabase
          .from("athletics")
          .select("id, name")
          .order("name")

        if (athleticsError) throw athleticsError
        setAthletics(athleticsData as Athletic[])
      } catch (error) {
        console.warn("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os jogos.",
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleParticipantToggle = (athleticId: string) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(athleticId)
        ? prev.participants.filter((id) => id !== athleticId)
        : [...prev.participants, athleticId],
    }))
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.sportId ||
      !formData.location ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime ||
      formData.participants.length < 2
    ) {
      toast({
        title: "Formulário incompleto",
        description:
          "Por favor, preencha todos os campos obrigatórios e selecione pelo menos duas atléticas participantes.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Format dates
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`)
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`)

      // Create game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          sport_id: formData.sportId,
          location: formData.location,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: "scheduled",
        })
        .select()

      if (gameError) throw gameError

      if (!gameData || gameData.length === 0) {
        throw new Error("Failed to create game")
      }

      // Add participants
      const participants = formData.participants.map((athleticId) => ({
        game_id: gameData[0].id,
        athletic_id: athleticId,
      }))

      const { error: participantsError } = await supabase.from("game_participants").insert(participants)

      if (participantsError) throw participantsError

      toast({
        title: "Jogo criado com sucesso",
        description: "O jogo foi adicionado à agenda do campeonato.",
      })

      // Reset form and close dialog
      setFormData({
        sportId: "",
        location: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        participants: [],
      })
      setIsDialogOpen(false)

      // Refresh the games list
      window.location.reload()
    } catch (error) {
      console.warn("Error creating game:", error)
      toast({
        title: "Erro ao criar jogo",
        description: "Não foi possível adicionar o jogo à agenda.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500">Agendado</Badge>
      case "in_progress":
        return <Badge className="bg-green-500">Em Andamento</Badge>
      case "completed":
        return <Badge className="bg-purple-500">Concluído</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelado</Badge>
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
          <h1 className="text-3xl font-bold">Jogos</h1>
          <p className="text-gray-500">
            {userRole === "admin"
              ? "Gerencie todos os jogos do campeonato."
              : userRole === "athletic"
                ? "Visualize os jogos da sua atlética."
                : "Confira a agenda de jogos do campeonato."}
          </p>
        </div>

        {userRole === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0456FC]">
                <Plus className="h-4 w-4 mr-2" />
                Novo Jogo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Jogo</DialogTitle>
                <DialogDescription>Preencha os detalhes para agendar um novo jogo no campeonato.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateGame} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sportId">Modalidade</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("sportId", value)}
                    value={formData.sportId || undefined}
                  >
                    <SelectTrigger id="sportId">
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {sports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.id}>
                          {sport.name} ({sport.type === "sport" ? "Esporte" : "Boteco"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Ex: Quadra Principal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora de Início</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora de Término</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Atléticas Participantes</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                    {athletics.map((athletic) => (
                      <div
                        key={athletic.id}
                        className={`
                          flex items-center p-2 rounded-md border cursor-pointer
                          ${
                            formData.participants.includes(athletic.id)
                              ? "border-[#0456FC] bg-blue-50"
                              : "border-gray-200"
                          }
                        `}
                        onClick={() => handleParticipantToggle(athletic.id)}
                      >
                        <div
                          className={`
                          w-4 h-4 rounded-sm mr-2 flex items-center justify-center
                          ${formData.participants.includes(athletic.id) ? "bg-[#0456FC]" : "border border-gray-300"}
                        `}
                        >
                          {formData.participants.includes(athletic.id) && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">{athletic.name}</span>
                      </div>
                    ))}
                  </div>
                  {formData.participants.length < 2 && (
                    <p className="text-xs text-red-500">Selecione pelo menos duas atléticas participantes.</p>
                  )}
                </div>

                <DialogFooter>
                  <Button type="submit" className="bg-[#0456FC]" disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Criar Jogo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Próximos Jogos</TabsTrigger>
          <TabsTrigger value="past">Jogos Anteriores</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {games.filter((game) => new Date(game.start_time) > new Date() && game.status !== "cancelled").length ===
          0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Não há jogos agendados para o futuro.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {games
                .filter((game) => new Date(game.start_time) > new Date() && game.status !== "cancelled")
                .map((game) => (
                  <Card key={game.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{game.sport.name}</CardTitle>
                        {getStatusBadge(game.status)}
                      </div>
                      <CardDescription>{game.sport.type === "sport" ? "Esporte" : "Jogo de Boteco"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{formatDateTime(game.start_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Até {formatDateTime(game.end_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{game.location}</span>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <Trophy className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-medium">Atléticas Participantes:</span>
                        </div>
                        <div className="pl-6 space-y-1">
                          {game.participants &&
                            game.participants.map((participant, index) => (
                              <div key={index} className="text-sm">
                                • {participant.athletic.name}
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {games.filter((game) => new Date(game.start_time) <= new Date() || game.status === "cancelled").length ===
          0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Não há jogos anteriores para exibir.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {games
                .filter((game) => new Date(game.start_time) <= new Date() || game.status === "cancelled")
                .map((game) => (
                  <Card key={game.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{game.sport.name}</CardTitle>
                        {getStatusBadge(game.status)}
                      </div>
                      <CardDescription>{game.sport.type === "sport" ? "Esporte" : "Jogo de Boteco"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{formatDateTime(game.start_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{game.location}</span>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <Trophy className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="font-medium">Atléticas Participantes:</span>
                        </div>
                        <div className="pl-6 space-y-1">
                          {game.participants &&
                            game.participants.map((participant, index) => (
                              <div key={index} className="text-sm">
                                • {participant.athletic.name}
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

