"use client"

import { AtletasAprovados } from "@/components/atletas-aprovados"
import { ValorTotal } from "@/components/valor-total"
import { ResumoPagamento } from "@/components/resumo-pagamento"
import { LoadingState } from "@/components/loading-state"
import { useAthletesList } from "@/hooks/use-cached-data"

function PagamentoAtletasContent() {
  const { loading } = useAthletesList({ status: "approved" })

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <AtletasAprovados />
      <ValorTotal />
      <div className="md:col-span-2 lg:col-span-1">
        <ResumoPagamento />
      </div>
    </div>
  )
}

export default function PagamentoAtletasPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Pagamento de Atletas</h1>
        <p className="text-muted-foreground">Gerencie os pagamentos baseados nos atletas aprovados da sua atlética</p>
      </div>

      <PagamentoAtletasContent />
    </div>
  )
}
