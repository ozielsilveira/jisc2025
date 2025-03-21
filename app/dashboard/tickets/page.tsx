"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"
import { Calendar, MapPin, QrCode } from "lucide-react"

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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
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
        setMyTickets(tickets as TicketPurchase[])
      } catch (error) {
        console.error("Error fetching tickets data:", error)
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
      console.error("Error purchasing ticket:", error)
      toast({
        title: "Erro na compra",
        description: "Não foi possível completar a compra do ingresso.",
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
        <h1 className="text-3xl font-bold">Ingressos</h1>
        <p className="text-gray-500">Compre ingressos para os eventos do JISC ou visualize seus ingressos.</p>
      </div>

      {/* Available Events Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Eventos Disponíveis</h2>

        {availableEvents.length === 0 ? (
          <p className="text-gray-500">Não há eventos disponíveis no momento.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.event_name}</CardTitle>
                  <CardDescription>
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
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(event.price)}</div>
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
        <h2 className="text-2xl font-semibold">Meus Ingressos</h2>

        {myTickets.length === 0 ? (
          <p className="text-gray-500">Você ainda não possui ingressos.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myTickets.map((purchase) => (
              <Card key={purchase.id}>
                <CardHeader>
                  <CardTitle>{purchase.ticket.event_name}</CardTitle>
                  <CardDescription>
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
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Quantidade</div>
                    <div>{purchase.quantity}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Valor Total</div>
                    <div>{formatCurrency(purchase.total_price)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="capitalize">{purchase.payment_status}</div>
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

