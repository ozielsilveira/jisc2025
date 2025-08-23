/*
 * Hooks refactor: unify repetitive data-fetching logic into a reusable helper
 * and expose resource-specific hooks with dependency injection. Each hook
 * uses the same pattern for loading, error handling, invalidation and
 * refetching while remaining independent of the underlying services. The
 * services themselves should implement cache and invalidation semantics.
 */

import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import {
  athleteService,
  athleticsService,
  packagesService,
  sportsService,
  staticDataService,
  userService,
  type Athlete,
  type Athletic,
  type Package,
  type Sport,
  type UserProfile
} from '@/lib/services'
import { useCallback, useEffect, useState, useMemo } from 'react'

/**
 * Generic hook to manage loading, error handling and refetching for any
 * asynchronous data source. It accepts a fetcher function and an
 * invalidator to clear cached data. Dependencies can be provided to
 * trigger refetches when external values change. The return signature
 * includes the loaded data, loading state, error message and a refetch
 * function.
 */
function useCachedResource<T>(fetchFn: () => Promise<T>, invalidateFn: () => void, deps: any[] = []) {
  const { toast } = useToast()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(message)
      toast({ title: 'Erro ao carregar dados', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [fetchFn, toast])

  const refetch = useCallback(() => {
    invalidateFn()
    fetchData()
  }, [invalidateFn, fetchData])

  // use a derived dependency array for useEffect to avoid React's
  // 'final argument passed to useEffect changed size between renders' error.
  // We map the deps array to a single stringified value which always
  // results in an array of constant length (either 0 or 1). This
  // prevents the array size from changing when the caller passes a
  // different number of dependencies between renders.
  const effectDeps = useMemo(() => {
    if (!deps || deps.length === 0) return []
    return [JSON.stringify(deps)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, effectDeps)

  return { data, loading, error, refetch }
}

// Hook for user profile and role data
export function useUserData() {
  const { user } = useAuth()

  // Compose a fetch function that returns both profile and role; if
  // user is undefined, short-circuit to null values.
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return { profile: null as UserProfile | null, role: null as string | null }
    const [profile, role] = await Promise.all([userService.getProfile(user.id), userService.getRole(user.id)])
    return { profile, role }
  }, [user?.id])

  const invalidate = useCallback(() => {
    if (user?.id) userService.invalidateUser(user.id)
  }, [user?.id])

  const { data, loading, error, refetch } = useCachedResource(fetchUserData, invalidate, [user?.id])

  return {
    profile: data?.profile ?? null,
    role: data?.role ?? null,
    loading,
    error,
    refetch
  }
}

// Hook for sports list with cache
export function useSports() {
  const fetchSports = useCallback(() => sportsService.getAll(), [])
  const invalidate = useCallback(() => sportsService.invalidate(), [])
  const { data, loading, error, refetch } = useCachedResource<Sport[]>(fetchSports, invalidate)
  return { sports: data ?? [], loading, error, refetch }
}

// Hook for athletics list with cache
export function useAthletics() {
  const fetchAthletics = useCallback(() => athleticsService.getAll(), [])
  const invalidate = useCallback(() => athleticsService.invalidate(), [])
  const { data, loading, error, refetch } = useCachedResource<Athletic[]>(fetchAthletics, invalidate)
  return { athletics: data ?? [], loading, error, refetch }
}

// Hook for packages list with cache
export function usePackages() {
  const fetchPackages = useCallback(() => packagesService.getAll(), [])
  const invalidate = useCallback(() => packagesService.invalidate(), [])
  const { data, loading, error, refetch } = useCachedResource<Package[]>(fetchPackages, invalidate)
  return { packages: data ?? [], loading, error, refetch }
}

// Hook for a single athlete record by user ID with cache
export function useAthleteData(userId?: string) {
  const fetchAthleteData = useCallback(async () => {
    if (!userId) return null
    return await athleteService.getByUserId(userId)
  }, [userId])
  const invalidate = useCallback(() => {
    if (userId) athleteService.invalidateAthlete(userId)
  }, [userId])
  const { data, loading, error, refetch } = useCachedResource<Athlete | null>(fetchAthleteData, invalidate, [userId])
  return { athlete: data, loading, error, refetch }
}

// Hook for list of athletes according to optional filters. When filters
// change the list will refetch automatically. Cache invalidation is
// delegated to the service.
export function useAthletesList(
  filters?: {
    userRole?: string
    athleticId?: string
    searchTerm?: string
    status?: string
    sportId?: string
  }
) {
  // O hook agora pode ser desabilitado passando `filters` como undefined.
  // Prepara um fetcher que retorna uma lista vazia se os filtros não
  // estiverem definidos, evitando uma chamada de API desnecessária.
  const fetchAthletes = useCallback(async () => {
    if (!filters) return []
    return athleteService.getList(filters)
  }, [filters])

  const invalidate = useCallback(() => athleteService.invalidateList(), [])

  // A dependência agora é o objeto de filtros em si. O `useCachedResource`
  // lida com a serialização para evitar re-fetches desnecessários.
  const { data, loading, error, refetch } = useCachedResource<Athlete[]>(fetchAthletes, invalidate, [filters])

  return { athletes: data ?? [], loading, error, refetch }
}

// Hook to load all static data (sports, athletics and packages) at once
export function useStaticData() {
  const fetchStatic = useCallback(() => staticDataService.loadAll(), [])
  const invalidate = useCallback(() => staticDataService.invalidateAll(), [])
  const { data, loading, error, refetch } = useCachedResource<{
    sports: Sport[]
    athletics: Athletic[]
    packages: Package[]
  }>(fetchStatic, invalidate)
  return {
    sports: data?.sports ?? [],
    athletics: data?.athletics ?? [],
    packages: data?.packages ?? [],
    loading,
    error,
    refetch
  }
}

// Hook to fetch athletic by representative ID with cache
export function useAthleticByRepresentative(representativeId?: string) {
  const { user } = useAuth()
  const id = representativeId ?? user?.id

  const fetchAthletic = useCallback(async () => {
    if (!id) return null
    return await athleticsService.getByRepresentative(id)
  }, [id])

  const invalidate = useCallback(() => {
    athleticsService.invalidate()
  }, [])

  const { data, loading, error, refetch } = useCachedResource<Athletic | null>(fetchAthletic, invalidate, [id])

  return { athletic: data, loading, error, refetch }
}

export const usePackagesList = usePackages
