'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import {
  useAthletesList,
  useAthleticByRepresentative,
  useAthletics,
  usePackages,
  useSports,
  useUserData
} from '@/hooks/use-cached-data'
import { Athlete, SortField, SortOrder } from '@/domain/athletes/entities'
import { IAthleteService } from '@/domain/athletes/ports'
import { applyFilters, sortAthletes, UiFilters } from './filters'
import { buildWhatsAppUrl, formatApproveMessage, formatRejectMessage } from './whatsapp'
import { invalidateCache } from '@/lib/cache'

export function useAthletesController(service: IAthleteService) {
  const { toast } = useToast()
  const {
    role: userRole,
    loading: roleLoading,
    profile
  } = useUserData()
  const searchParams = useSearchParams()

  // cache: listas base
  const { athletics } = useAthletics()
  const { sports } = useSports()
  const { packages } = usePackages()

  // descobre athletic do representante
  const { athletic: userAthletic, loading: athleticLoading } = useAthleticByRepresentative(profile?.id)

  // estado de filtro/ordem
  const [filters, setFilters] = useState<UiFilters>({
    athleticId: undefined, // Começa indefinido para evitar busca inicial
    status: 'all',
    sportId: 'all',
    whatsapp: 'all'
  })
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Aguarda dados do usuário para definir o filtro inicial de atlética
  useEffect(() => {
    // Não faz nada até que os dados do usuário e da atlética (se aplicável) estejam prontos
    if (roleLoading || (userRole === 'athletic' && athleticLoading)) {
      return
    }

    // Define o filtro com base na role
    if (userRole === 'admin') {
      const p = searchParams.get('athletic')
      // Admin pode ver tudo ou uma atlética específica
      setFilters((prev) => ({ ...prev, athleticId: p || 'all' }))
    } else if (userRole === 'athletic') {
      // Role atlética SÓ PODE ver sua própria atlética.
      // Se não tiver uma, o backend já vai barrar, mas setamos mesmo assim.
      setFilters((prev) => ({ ...prev, athleticId: userAthletic?.id || 'none' }))
    } else {
      // Qualquer outro role não deve ver nenhuma atlética
      setFilters((prev) => ({ ...prev, athleticId: 'none' }))
    }
  }, [userRole, roleLoading, userAthletic, athleticLoading, searchParams])

  // A busca agora é controlada pelo estado de 'athleticId'.
  // Se for 'undefined' (inicial) ou 'none' (sem permissão), não busca.
  const isReadyToFetch = filters.athleticId !== undefined && filters.athleticId !== 'none'

  const {
    athletes,
    loading: athletesLoading,
    error,
    refetch
  } = useAthletesList(isReadyToFetch ? filters : undefined)

  const isLoading = roleLoading || (userRole === 'athletic' && athleticLoading) || athletesLoading

  const refetchWithCacheClear = useCallback(() => {
    invalidateCache.athletesList()
    refetch()
  }, [refetch])

  // derivados
  const filteredSorted = useMemo(() => {
    const f = applyFilters(athletes, filters)
    const s = sortAthletes(f, sortField, sortOrder)
    return s
  }, [athletes, filters, sortField, sortOrder])

  const hasActiveFilters =
    filters.athleticId !== 'all' ||
    filters.status !== 'all' ||
    filters.sportId !== 'all' ||
    filters.whatsapp !== 'all'

  // actions
  async function approve(id:string) {
    try {
      await service.updateStatus(id, 'approved')
      toast({ title: '✅ Atleta aprovado!', description: 'O atleta foi aprovado com sucesso.', variant: 'success' })
      refetchWithCacheClear()
    } catch (e) {
      toast({ title: '❌ Erro na aprovação', description: 'Tente novamente.', variant: 'destructive' })
    }
  }

  function openApproveWhatsApp(a: Athlete) {
    if (!a.athlete_packages?.length) return null
    const pkg = a.athlete_packages[0]
    const msg = formatApproveMessage(a.user.name, pkg.package.name, pkg.package.price)
    return buildWhatsAppUrl(a.user.phone, msg)
  }

  async function confirmApproveWhatsApp(a: Athlete) {
    try {
      await service.updateWhatsAppStatus(a.id, true)
      const url = openApproveWhatsApp(a)
      if (url) window.location.href = url
      toast({ title: '📱 WhatsApp enviado!', description: 'Status atualizado e WhatsApp aberto.', variant: 'success' })
      refetchWithCacheClear()
    } catch (e) {
      toast({ title: '❌ Erro ao enviar WhatsApp', description: 'Tente novamente.', variant: 'destructive' })
    }
  }

  function buildRejectPreview(a: Athlete, custom?: string) {
    return formatRejectMessage(a.user.name, custom, typeof window !== 'undefined' ? window.location.origin : '')
  }

  async function rejectAndNotify(a: Athlete, custom?: string) {
    try {
      await service.updateStatus(a.id, 'rejected')
      const msg = buildRejectPreview(a, custom)
      const url = buildWhatsAppUrl(a.user.phone, msg)
      window.location.href = url
      toast({ title: '⚠️ Atleta rejeitado', description: 'Mensagem aberta no WhatsApp.', variant: 'destructive' })
      refetchWithCacheClear()
    } catch (e) {
      toast({ title: '❌ Erro na rejeição', description: 'Tente novamente.', variant: 'destructive' })
    }
  }

  function clearFilters() {
    const baseFilters = {
      athleticId: 'all', // Padrão para admin
      status: 'all',
      sportId: 'all',
      whatsapp: 'all'
    }

    // Para atlética, o filtro NUNCA deve ser 'all'.
    // Ele deve ser o ID da sua atlética.
    if (userRole === 'athletic') {
      baseFilters.athleticId = userAthletic?.id || 'none'
    } else if (userRole !== 'admin') {
      baseFilters.athleticId = 'none'
    }

    setFilters(baseFilters)
  }

  return {
    // dados base
    athletics,
    sports,
    packages,
    // estado e derivados
    userRole,
    loading: isLoading,
    error,
    refetch: refetchWithCacheClear,
    filters,
    setFilters,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    athletesFiltered: filteredSorted,
    hasActiveFilters,
    // ações
    approve,
    confirmApproveWhatsApp,
    openApproveWhatsApp,
    buildRejectPreview,
    rejectAndNotify,
    clearFilters
  }
}
