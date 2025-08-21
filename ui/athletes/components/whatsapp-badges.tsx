import { Badge } from '@/components/ui/badge'
import { CheckCircle, MessageCircle } from 'lucide-react'

export function WhatsAppStatusBadge({ sent }: { sent: boolean }) {
  return (
    <Badge
      variant='outline'
      className={`text-sm font-medium px-3 py-1 ${sent ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
    >
      {sent ? (
        <>
          <CheckCircle className='h-3 w-3 mr-2' />
          WhatsApp Enviado
        </>
      ) : (
        <>
          <MessageCircle className='h-3 w-3 mr-2' />
          WhatsApp Pendente
        </>
      )}
    </Badge>
  )
}
