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
import { useCallback, useEffect, useState } from 'react'

// Hook para dados do usuário com cache
export const useUserData = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [profileData, roleData] = await Promise.all([userService.getProfile(user.id), userService.getRole(user.id)])

      setProfile(profileData)
      setRole(roleData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do usuário'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar dados',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  const refetch = useCallback(() => {
    if (user?.id) {
      userService.invalidateUser(user.id)
      fetchUserData()
    }
  }, [user?.id, fetchUserData])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return {
    profile,
    role,
    loading,
    error,
    refetch
  }
}

// Hook para modalidades com cache
export const useSports = () => {
  const { toast } = useToast()
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSports = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await sportsService.getAll()
      setSports(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar modalidades'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar modalidades',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const refetch = useCallback(() => {
    sportsService.invalidate()
    fetchSports()
  }, [fetchSports])

  useEffect(() => {
    fetchSports()
  }, [fetchSports])

  return {
    sports,
    loading,
    error,
    refetch
  }
}

// Hook para atléticas com cache
export const useAthletics = () => {
  const { toast } = useToast()
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAthletics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await athleticsService.getAll()
      setAthletics(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atléticas'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar atléticas',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const refetch = useCallback(() => {
    athleticsService.invalidate()
    fetchAthletics()
  }, [fetchAthletics])

  useEffect(() => {
    fetchAthletics()
  }, [fetchAthletics])

  return {
    athletics,
    loading,
    error,
    refetch
  }
}

// Hook para pacotes com cache
export const usePackages = () => {
  const { toast } = useToast()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await packagesService.getAll()
      setPackages(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pacotes'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar pacotes',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const refetch = useCallback(() => {
    packagesService.invalidate()
    fetchPackages()
  }, [fetchPackages])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  return {
    packages,
    loading,
    error,
    refetch
  }
}

// Hook para dados de atleta com cache
export const useAthleteData = (userId?: string) => {
  const { toast } = useToast()
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAthleteData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await athleteService.getByUserId(userId)
      setAthlete(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do atleta'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar dados do atleta',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [userId, toast])

  const refetch = useCallback(() => {
    if (userId) {
      athleteService.invalidateAthlete(userId)
      fetchAthleteData()
    }
  }, [userId, fetchAthleteData])

  useEffect(() => {
    fetchAthleteData()
  }, [fetchAthleteData])

  return {
    athlete,
    loading,
    error,
    refetch
  }
}

// Hook para lista de atletas com cache e filtros
export const useAthletesList = (
  filters: {
    userRole?: string
    athleticId?: string
    searchTerm?: string
    status?: string
    sportId?: string
  } = {}
) => {
  const { toast } = useToast()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAthletes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await athleteService.getList(filters)
      setAthletes(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atletas'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar atletas',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])

  const refetch = useCallback(() => {
    athleteService.invalidateList()
    fetchAthletes()
  }, [fetchAthletes])

  useEffect(() => {
    fetchAthletes()
  }, [fetchAthletes])

  return {
    athletes,
    loading,
    error,
    refetch
  }
}

// Hook para dados estáticos (carrega tudo de uma vez)
export const useStaticData = () => {
  const { toast } = useToast()
  const [data, setData] = useState<{
    sports: Sport[]
    athletics: Athletic[]
    packages: Package[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStaticData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const staticData = await staticDataService.loadAll()
      setData(staticData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar dados',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const refetch = useCallback(() => {
    staticDataService.invalidateAll()
    fetchStaticData()
  }, [fetchStaticData])

  useEffect(() => {
    fetchStaticData()
  }, [fetchStaticData])

  return {
    sports: data?.sports || [],
    athletics: data?.athletics || [],
    packages: data?.packages || [],
    loading,
    error,
    refetch
  }
}

// Hook para atlética por representante
export const useAthleticByRepresentative = (representativeId?: string) => {
  const { toast } = useToast()
  const [athletic, setAthletic] = useState<Athletic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAthletic = useCallback(async () => {
    if (!representativeId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await athleticsService.getByRepresentative(representativeId)
      setAthletic(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atlética'
      setError(errorMessage)
      toast({
        title: 'Erro ao carregar atlética',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [representativeId, toast])

  const refetch = useCallback(() => {
    if (representativeId) {
      athleticsService.invalidate()
      fetchAthletic()
    }
  }, [representativeId, fetchAthletic])

  useEffect(() => {
    fetchAthletic()
  }, [fetchAthletic])

  return {
    athletic,
    loading,
    error,
    refetch
  }
}
