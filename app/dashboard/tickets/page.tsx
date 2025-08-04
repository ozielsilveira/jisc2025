"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Calendar, MapPin, Plus, QrCode } from "lucide-react"
import { useEffect, useState } from "react"

type TicketEvent = {
  id: string
  event_name: string
  price: number
  date: string
  location: string
  remaining_quantity: number
  total_quantity: number
}

type TicketPurchase = {
  id: string
  ticket_id: string
  quantity: number
  total_price: number
  payment_status: string
  qr_code: string
  created_at: string
  ticket: TicketEvent
}

export default function TicketsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [availableEvents, setAvailableEvents] = useState<TicketEvent[]>([])
  const [myTickets, setMyTickets] = useState<TicketPurchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    event_name: "",
    price: "",
    date: "",
    location: "",
    total_quantity: "",
  })

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

        // Fetch available events
        const { data: events, error: eventsError } = await supabase
          .from("tickets")
          .select("*")
          .gt("remaining_quantity", 0)
          .order("date", { ascending: true })

        if (eventsError) throw eventsError
        setAvailableEvents(events as TicketEvent[])

        // Fetch user's tickets
        const { data: tickets, error: ticketsError } = await supabase
          .from("ticket_purchases")
          .select(`
            id,
            ticket_id,
            quantity,
            total_price,
            payment_status,
            qr_code,
            created_at,
            ticket:tickets(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (ticketsError) throw ticketsError
        setMyTickets(tickets as unknown as TicketPurchase[])
      } catch (error) {
        console.warn("Error fetching tickets data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os ingressos.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const handleBuyTicket = async (ticketId: string) => {
    if (!user) return

    try {
      // In a real application, this would redirect to a checkout page
      // For this example, we'll simulate a direct purchase
      const selectedTicket = availableEvents.find((event) => event.id === ticketId)

      if (!selectedTicket) {
        toast({
          title: "Erro",
          description: "Ingresso não encontrado.",
          variant: "destructive",
        })
        return
      }

      // Generate a simple QR code (in a real app, this would be more secure)
      const qrCode = `JISC-${user.id}-${ticketId}-${Date.now()}`

      // Create the purchase record
      const { error } = await supabase.from("ticket_purchases").insert({
        user_id: user.id,
        ticket_id: ticketId,
        quantity: 1,
        total_price: selectedTicket.price,
        payment_status: "completed",
        qr_code: qrCode,
      })

      if (error) throw error

      // Update the remaining quantity
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          remaining_quantity: selectedTicket.remaining_quantity - 1,
        })
        .eq("id", ticketId)

      if (updateError) throw updateError

      toast({
        title: "Compra realizada com sucesso!",
        description: "Seu ingresso foi adicionado à sua conta.",
      })

      // Refresh the data
      window.location.reload()
    } catch (error) {
      console.warn("Error purchasing ticket:", error)
      toast({
        title: "Erro na compra",
        description: "Não foi possível completar a compra do ingresso.",
        variant: "destructive",
      })
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase.from("tickets").insert({
        event_name: newEvent.event_name,
        price: parseFloat(newEvent.price),
        date: newEvent.date,
        location: newEvent.location,
        total_quantity: parseInt(newEvent.total_quantity),
        remaining_quantity: parseInt(newEvent.total_quantity),
      })

      if (error) throw error

      toast({
        title: "Evento criado com sucesso!",
        description: "O novo evento foi adicionado à lista de eventos disponíveis.",
      })

      // Reset form and close dialog
      setNewEvent({
        event_name: "",
        price: "",
        date: "",
        location: "",
        total_quantity: "",
      })
      setIsDialogOpen(false)

      // Refresh the data
      window.location.reload()
    } catch (error) {
      console.warn("Error creating event:", error)
      toast({
        title: "Erro ao criar evento",
        description: "Não foi possível criar o novo evento.",
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
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ingressos</h1>
          <p className="text-sm sm:text-base text-gray-500">Compre ingressos para os eventos do JISC ou visualize seus ingressos.</p>
        </div>

        {userRole === "admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-[#0456FC]">
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Evento</DialogTitle>
                <DialogDescription>Preencha os detalhes do novo evento.</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateEvent} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event_name">Nome do Evento</Label>
                  <Input
                    id="event_name"
                    value={newEvent.event_name}
                    onChange={(e) => setNewEvent({ ...newEvent, event_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data e Hora</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_quantity">Quantidade Total de Ingressos</Label>
                  <Input
                    id="total_quantity"
                    type="number"
                    min="1"
                    value={newEvent.total_quantity}
                    onChange={(e) => setNewEvent({ ...newEvent, total_quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#0456FC]">
                    Criar Evento
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Available Events Section */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Eventos Disponíveis</h2>

        {availableEvents.length === 0 ? (
          <p className="text-gray-500">Não há eventos disponíveis no momento.</p>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {availableEvents.map((event) => (
              <Card key={event.id} className="flex flex-col">
                <CardHeader className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">{event.event_name}</CardTitle>
                  <CardDescription className="text-sm">
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{event.location}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-xl sm:text-2xl font-bold">{formatCurrency(event.price)}</div>
                  <p className="text-sm text-gray-500">
                    {event.remaining_quantity} de {event.total_quantity} ingressos disponíveis
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-[#0456FC]" onClick={() => handleBuyTicket(event.id)}>
                    Comprar Ingresso
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My Tickets Section */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Meus Ingressos</h2>

        {myTickets.length === 0 ? (
          <p className="text-gray-500">Você ainda não possui ingressos.</p>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {myTickets.map((purchase) => (
              <Card key={purchase.id} className="flex flex-col">
                <CardHeader className="flex-1">
                  <CardTitle className="text-lg sm:text-xl">{purchase.ticket.event_name}</CardTitle>
                  <CardDescription className="text-sm">
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(purchase.ticket.date)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{purchase.ticket.location}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 sm:space-y-4">
                  <div>
                    <div className="text-sm font-medium">Quantidade</div>
                    <div className="text-base sm:text-lg">{purchase.quantity}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Valor Total</div>
                    <div className="text-base sm:text-lg">{formatCurrency(purchase.total_price)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="capitalize text-base sm:text-lg">{purchase.payment_status}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full flex items-center justify-center gap-2" variant="outline">
                    <QrCode className="h-4 w-4" />
                    Ver QR Code
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

