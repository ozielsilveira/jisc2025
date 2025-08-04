"use client"

import { useAuth } from "@/components/auth-provider"
import { PixDisplay } from "@/components/pix-display"
import { QRCodeDisplay } from "@/components/qr-code"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Calendar, MapPin, Share2, Ticket, User } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type TicketPurchase = {
  id: string
  user_id: string
  ticket_id: string
  quantity: number
  total_price: number
  payment_status: string
  payment_date: string | null
  qr_code: string
  athletic_referral_id: string | null
  created_at: string
  ticket: {
    event_name: string
    date: string
    location: string
    price: number
  }
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

export default function TicketDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [ticketPurchase, setTicketPurchase] = useState<TicketPurchase | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTicket = async () => {
      if (!user || !id) return

      try {
        const { data, error } = await supabase
          .from("ticket_purchases")
          .select(`
            *,
            ticket:tickets(*),
            user:users(name, email),
            athletic:athletics(name, pix_code, pix_approved)
          `)
          .eq("id", id)
          .single()

        if (error) throw error

        // Check if the ticket belongs to the user
        if (data.user_id !== user.id) {
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para visualizar este ingresso.",
            variant: "destructive",
          })
          router.push("/dashboard/tickets")
          return
        }

        setTicketPurchase(data as TicketPurchase)
      } catch (error) {
        console.warn("Error fetching ticket:", error)
        toast({
          title: "Erro ao carregar ingresso",
          description: "Não foi possível carregar os detalhes do ingresso.",
          variant: "destructive",
        })
        router.push("/dashboard/tickets")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTicket()
  }, [user, id, toast, router])

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ingresso JISC - ${ticketPurchase?.ticket.event_name}`,
          text: `Meu ingresso para ${ticketPurchase?.ticket.event_name} no JISC!`,
          url: window.location.href,
        })
      } catch (error) {
        console.warn("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copiado",
        description: "O link do ingresso foi copiado para a área de transferência.",
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

  if (!ticketPurchase) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-2">Ingresso não encontrado</h1>
        <p className="text-gray-500 mb-4">O ingresso solicitado não foi encontrado.</p>
        <Button onClick={() => router.push("/dashboard/tickets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Ingressos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.push("/dashboard/tickets")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detalhes do Ingresso</h1>
          <p className="text-gray-500">Visualize os detalhes e o QR Code do seu ingresso.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{ticketPurchase.ticket.event_name}</CardTitle>
            <CardDescription>Ingresso #{ticketPurchase.id.substring(0, 8).toUpperCase()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-500" />
              <span>{ticketPurchase.user.name}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>{formatDate(ticketPurchase.ticket.date)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span>{ticketPurchase.ticket.location}</span>
            </div>
            <div className="flex items-center">
              <Ticket className="h-4 w-4 mr-2 text-gray-500" />
              <span>Quantidade: {ticketPurchase.quantity}</span>
            </div>
            <div className="font-bold">Total: {formatCurrency(ticketPurchase.total_price)}</div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar Ingresso
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code do Ingresso</CardTitle>
              <CardDescription>Apresente este QR Code na entrada do evento.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <QRCodeDisplay value={ticketPurchase.qr_code} size={250} level="H" className="mb-4" />
              <p className="text-sm text-center text-gray-500">
                Este QR Code é único e pessoal. Não compartilhe com outras pessoas.
              </p>
            </CardContent>
          </Card>

          {ticketPurchase.athletic_referral_id &&
            ticketPurchase.athletic?.pix_code &&
            ticketPurchase.athletic?.pix_approved && (
              <Card>
                <CardHeader>
                  <CardTitle>Pagamento para Atlética</CardTitle>
                  <CardDescription>
                    Utilize a chave PIX abaixo para realizar o pagamento para a atlética.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PixDisplay
                    pixKey={ticketPurchase.athletic.pix_code}
                    athleticName={ticketPurchase.athletic.name}
                    showQRCode={false}
                  />
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  )
}

