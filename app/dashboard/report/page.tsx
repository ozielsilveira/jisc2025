'use client'

import { AtletasAprovados } from '@/components/atletas-aprovados'
import { ValorTotal } from '@/components/valor-total'
import { ResumoPagamento } from '@/components/resumo-pagamento'
import { LoadingState } from '@/components/loading-state'
import { useAthletesList, useAthletics, useUserData } from '@/hooks/use-cached-data'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ValorAReceber } from '@/components/valor-a-receber'

function PagamentoAtletasContent() {
  const { role } = useUserData()
  const { athletics } = useAthletics()
  const [selectedAthletic, setSelectedAthletic] = useState('all')

  const { loading } = useAthletesList({
    status: 'approved',
    athleticId: selectedAthletic
  })

  if (loading) {
    return <LoadingState />
  }

  return (
    <>
      {role === 'admin' && (
        <div className='mb-4 max-w-sm'>
          <Label htmlFor='athletic-filter'>Filtrar por Atlética</Label>
          <Select value={selectedAthletic} onValueChange={setSelectedAthletic}>
            <SelectTrigger id='athletic-filter'>
              <SelectValue placeholder='Selecione uma atlética' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todas as Atléticas</SelectItem>
              {athletics.map((athletic) => (
                <SelectItem key={athletic.id} value={athletic.id}>
                  {athletic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2'>
        <AtletasAprovados athleticId={selectedAthletic} />
        <ValorTotal athleticId={selectedAthletic} />
        <div className='md:col-span-2 '>
          <ResumoPagamento athleticId={selectedAthletic} />
        </div>
      </div>
    </>
  )
}

export default function PagamentoAtletasPage() {
  return (
    <div className='container mx-auto p-6 space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Sistema de Pagamento de Atletas</h1>
        <p className='text-muted-foreground'>Gerencie os pagamentos baseados nos atletas aprovados da sua atlética</p>
      </div>

      <PagamentoAtletasContent />
    </div>
  )
}
