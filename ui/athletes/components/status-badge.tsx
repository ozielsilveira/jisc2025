import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { Athlete } from '@/domain/athletes/entities'

export function StatusBadge({ status }: { status: Athlete['status'] }) {
  const map: Record<Athlete['status'], { label: string; cls: string; Icon: any }> = {
    approved: { label: 'Aprovado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
    rejected: { label: 'Rejeitado', cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
    pending: { label: 'Pendente', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: AlertCircle },
    sent: { label: 'Em Análise', cls: 'bg-blue-50 text-blue-700 border-blue-200', Icon: Loader2 }
  }
  const s = map[status]
  if (!s) {
    return null
  }
  const I = s.Icon
  return (
    <Badge variant='outline' className={`${s.cls} font-medium px-3 py-1 text-sm`}>
      <I className='h-3 w-3 mr-2' /> {s.label}
    </Badge>
  )
}
