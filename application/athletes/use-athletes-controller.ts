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
    searchTerm: '',
    athleticId: undefined, // Começa indefinido para evitar busca inicial
    status: 'all',
    sportId: 'all',
    whatsapp: 'all'
  })
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Aguarda dados do usuário para definir o filtro inicial de atlética
  useEffect(() => {
    if (roleLoading || (userRole === 'athletic' && athleticLoading)) return

    if (userRole === 'athletic' && userAthletic) {
      setFilters((prev) => ({ ...prev, athleticId: userAthletic.id }))
    } else if (userRole === 'admin') {
      const p = searchParams.get('athletic')
      setFilters((prev) => ({ ...prev, athleticId: p || 'all' }))
    } else {
      setFilters((prev) => ({ ...prev, athleticId: 'all' }))
    }
  }, [userRole, roleLoading, userAthletic, athleticLoading, searchParams])

  // Só busca atletas se o filtro de atlética estiver definido
  const isReady = filters.athleticId !== undefined

  const {
    athletes,
    loading: athletesLoading,
    error,
    refetch
  } = useAthletesList(isReady ? filters : undefined)

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
    !!filters.searchTerm ||
    filters.athleticId !== 'all' ||
    filters.status !== 'all' ||
    filters.sportId !== 'all' ||
    filters.whatsapp !== 'all'

  // actions
  async function approve(id:string) {
    try {
      await service.updateStatus(id, 'approved')
      toast({ title: '✅ Atleta aprovado!', description: 'O atleta foi aprovado com sucesso.' })
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
      toast({ title: '📱 WhatsApp enviado!', description: 'Status atualizado e WhatsApp aberto.' })
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
      toast({ title: '⚠️ Atleta rejeitado', description: 'Mensagem aberta no WhatsApp.' })
      refetchWithCacheClear()
    } catch (e) {
      toast({ title: '❌ Erro na rejeição', description: 'Tente novamente.', variant: 'destructive' })
    }
  }

  function clearFilters() {
    const baseFilters = {
      searchTerm: '',
      athleticId: 'all', // Default for admin
      status: 'all',
      sportId: 'all',
      whatsapp: 'all'
    }

    if (userRole === 'athletic') {
      baseFilters.athleticId = userAthletic?.id || 'all'
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
