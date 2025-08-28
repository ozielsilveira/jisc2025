import { cache, CACHE_KEYS, createCacheKey, invalidateCache } from './cache'
import { supabase } from './supabase'

// Tipos
export interface UserProfile {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  gender: string
  role: string
}

export type SortField = 'name' | 'created_at' | 'status' | 'athletic'
export type SortOrder = 'asc' | 'desc'

export interface Sport {
  id: string
  name: string
  type: 'sport' | 'boteco'
}

export interface Athletic {
  id: string
  name: string
  university: string
  representative_id?: string
}

export interface Package {
  id: string
  name: string
  price: number
  description: string
}

export interface Athlete {
  id: string
  user_id: string
  athletic_id: string
  enrollment_document_url: string
  status: 'pending' | 'sent' | 'approved' | 'rejected'
  created_at: string
  cnh_cpf_document_url: string
  wpp_sent: boolean
  admin_approved: boolean | null
  user: UserProfile
  athletic: Athletic
  sports: Sport[]
  athlete_packages?: Array<{
    id: string
    payment_status: string
    package: Package
  }>
}

// Serviços com cache

export const userService = {
  // Buscar perfil do usuário com cache
  async getProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = CACHE_KEYS.USER_PROFILE(userId)

    // Verificar cache primeiro
    const cached = cache.get<UserProfile>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()

    if (error) throw error

    // Armazenar no cache por 10 minutos
    cache.set(cacheKey, data, 10 * 60 * 1000)
    return data
  },

  // Buscar role do usuário com cache
  async getRole(userId: string): Promise<string | null> {
    const cacheKey = CACHE_KEYS.USER_ROLE(userId)

    const cached = cache.get<string>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase.from('users').select('role').eq('id', userId).single()

    if (error) throw error

    cache.set(cacheKey, data.role, 10 * 60 * 1000)
    return data.role
  },

  // Invalidar cache do usuário
  invalidateUser(userId: string) {
    invalidateCache.user(userId)
  }
}

export const sportsService = {
  // Buscar modalidades com cache longo (dados estáticos)
  async getAll(): Promise<Sport[]> {
    const cacheKey = CACHE_KEYS.SPORTS

    const cached = cache.get<Sport[]>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase.from('sports').select('*').order('name')

    if (error) throw error

    // Cache por 30 minutos para dados estáticos
    cache.set(cacheKey, data, 30 * 60 * 1000)
    return data
  },

  // Invalidar cache de modalidades
  invalidate() {
    cache.delete(CACHE_KEYS.SPORTS)
  }
}

export const athleticsService = {
  // Buscar atléticas com cache
  async getAll(): Promise<Athletic[]> {
    const cacheKey = CACHE_KEYS.ATHLETICS

    const cached = cache.get<Athletic[]>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase.from('athletics').select('*').order('name')

    if (error) throw error

    // Cache por 15 minutos
    cache.set(cacheKey, data, 15 * 60 * 1000)
    return data
  },

  // Buscar atlética por representante
  async getByRepresentative(representativeId: string): Promise<Athletic | null> {
    const cacheKey = CACHE_KEYS.ATHLETIC_BY_REPRESENTATIVE(representativeId)

    const cached = cache.get<Athletic>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('athletics')
      .select('*')
      .eq('representative_id', representativeId)
      .maybeSingle()

    if (error) throw error

    cache.set(cacheKey, data, 10 * 60 * 1000)
    return data
  },

  // Invalidar cache de atléticas
  invalidate() {
    cache.delete(CACHE_KEYS.ATHLETICS)
  }
}

export const packagesService = {
  // Buscar pacotes com cache
  async getAll(): Promise<Package[]> {
    const cacheKey = CACHE_KEYS.PACKAGES

    const cached = cache.get<Package[]>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase.from('packages').select('*').order('name')

    if (error) throw error

    // Cache por 30 minutos para dados estáticos
    cache.set(cacheKey, data, 30 * 60 * 1000)
    return data
  },

  // Buscar pacotes SEM cache (dados sempre frescos)
  async getAllFresh(): Promise<Package[]> {
    const { data, error } = await supabase.from('packages').select('*').order('price')

    if (error) throw error

    return data
  },

  // Invalidar cache de pacotes
  invalidate() {
    cache.delete(CACHE_KEYS.PACKAGES)
  }
}

export const athletePackagesService = {
  // Atualizar ou criar pacote de atleta
  async upsertPackage(athleteId: string, packageId: string, paymentStatus: string = 'pending'): Promise<void> {
    // Verificar se já existe um registro
    const { data: existing, error: fetchError } = await supabase
      .from('athlete_packages')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('package_id', packageId)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('athlete_packages')
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (updateError) throw updateError
    } else {
      // Inserir novo registro
      const { error: insertError } = await supabase
        .from('athlete_packages')
        .insert({
          athlete_id: athleteId,
          package_id: packageId,
          payment_status: paymentStatus
        })

      if (insertError) throw insertError
    }

    // Invalidar cache relacionado
    invalidateCache.athlete(athleteId)
    invalidateCache.athletesList()
  },

  // Alterar pacote do atleta com regras de status
  async changeAthletePackage(athleteId: string, packageId: string): Promise<void> {
    // 1. Primeiro, obter o status atual do atleta
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('status')
      .eq('id', athleteId)
      .single()

    if (athleteError) throw athleteError

    // 2. Aplicar regras de status conforme especificado
    let newStatus = athlete.status
    switch (athlete.status) {
      case 'approved':
        newStatus = 'sent'
        break
      case 'sent':
        newStatus = 'sent' // mantém sent
        break
      case 'pending':
        newStatus = 'pending' // mantém pending
        break
      case 'rejected':
        newStatus = 'rejected' // mantém rejected
        break
      default:
        // Para outros status, mantém o atual
        newStatus = athlete.status
    }

    // 3. Atualizar o status do atleta se necessário
    if (newStatus !== athlete.status) {
      const { error: statusUpdateError } = await supabase
        .from('athletes')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', athleteId)

      if (statusUpdateError) throw statusUpdateError
    }

    // 4. Atualizar ou criar o pacote
    await this.upsertPackage(athleteId, packageId, 'pending')

    // 5. Invalidar cache relacionado
    invalidateCache.athlete(athleteId)
    invalidateCache.athletesList()
  },

  // Buscar pacotes de um atleta
  async getByAthleteId(athleteId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('athlete_packages')
      .select(`
        *,
        package:packages!athlete_packages_package_id_fkey(*)
      `)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Invalidar cache de pacotes de atleta
  invalidateByAthlete(athleteId: string) {
    invalidateCache.athlete(athleteId)
    invalidateCache.athletesList()
  }
}

export const athleteService = {
  // Buscar atleta por ID com cache
  async getById(athleteId: string): Promise<Athlete | null> {
    const cacheKey = CACHE_KEYS.ATHLETE(athleteId)

    const cached = cache.get<Athlete>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('athletes')
      .select(
        `
        *,
        user:users!athletes_user_id_fkey(*),
        athletic:athletics!athletes_athletic_id_fkey(*),
        athlete_sports!athlete_sports_athlete_id_fkey(
          sport:sports!athlete_sports_sport_id_fkey(*)
        ),
        athlete_packages!athlete_packages_athlete_id_fkey(
          *,
          package:packages!athlete_packages_package_id_fkey(*)
        )
      `
      )
      .eq('id', athleteId)
      .single()

    if (error) throw error

    // Formatar dados
    const formattedAthlete = {
      ...data,
      sports: data.athlete_sports?.map((as: any) => as.sport).filter(Boolean) || [],
      athlete_packages: data.athlete_packages || []
    }

    cache.set(cacheKey, formattedAthlete, 5 * 60 * 1000)
    return formattedAthlete
  },

  // Buscar atleta por usuário com cache
  async getByUserId(userId: string): Promise<Athlete | null> {
    const cacheKey = CACHE_KEYS.ATHLETE_BY_USER(userId)

    const cached = cache.get<Athlete>(cacheKey)
    if (cached) {
      return cached
    }

    const { data, error } = await supabase
      .from('athletes')
      .select(
        `
        *,
        user:users!athletes_user_id_fkey(*),
        athletic:athletics!athletes_athletic_id_fkey(*),
        athlete_sports!athlete_sports_athlete_id_fkey(
          sport:sports!athlete_sports_sport_id_fkey(*)
        ),
        athlete_packages!athlete_packages_athlete_id_fkey(
          *,
          package:packages!athlete_packages_package_id_fkey(*)
        )
      `
      )
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      cache.set(cacheKey, null, 5 * 60 * 1000)
      return null
    }

    // Formatar dados
    const formattedAthlete = {
      ...data,
      sports: data.athlete_sports?.map((as: any) => as.sport).filter(Boolean) || [],
      athlete_packages: data.athlete_packages || []
    }

    cache.set(cacheKey, formattedAthlete, 5 * 60 * 1000)
    return formattedAthlete
  },

  // Buscar atleta por usuário SEM cache (dados sempre frescos)
  async getByUserIdFresh(userId: string): Promise<Athlete | null> {
    const { data, error } = await supabase
      .from('athletes')
      .select(
        `
        *,
        user:users!athletes_user_id_fkey(*),
        athletic:athletics!athletes_athletic_id_fkey(*),
        athlete_sports!athlete_sports_athlete_id_fkey(
          sport:sports!athlete_sports_sport_id_fkey(*)
        ),
        athlete_packages!athlete_packages_athlete_id_fkey(
          *,
          package:packages!athlete_packages_package_id_fkey(*)
        )
      `
      )
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return null
    }

    // Formatar dados
    const formattedAthlete = {
      ...data,
      sports: data.athlete_sports?.map((as: any) => as.sport).filter(Boolean) || [],
      athlete_packages: data.athlete_packages || []
    }

    return formattedAthlete
  },

  // Buscar lista de atletas com filtros e cache
  async getList(
    filters: {
      userRole?: string
      athleticId?: string
      searchTerm?: string
      status?: string
      sportId?: string
    } = {}
  ): Promise<Athlete[]> {
    // 1. Obter usuário autenticado
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return [] // Não deveria acontecer em rotas protegidas

    // 2. Obter role do usuário
    const userRole = await userService.getRole(user.id)

    // 3. Modificar o cacheKey para incluir o userRole e o ID do usuário para garantir que o cache seja por usuário
    const cacheKey = createCacheKey('athletes_list_v2', { ...filters, userId: user.id, userRole })

    const cached = cache.get<Athlete[]>(cacheKey)
    if (cached) {
      return cached
    }

    let query = supabase
      .from('athletes')
      .select(
        `
        *,
        user:users!athletes_user_id_fkey(*),
        athletic:athletics!athletes_athletic_id_fkey(*),
        athlete_sports!athlete_sports_athlete_id_fkey(
          sport:sports!athlete_sports_sport_id_fkey(*)
        ),
        athlete_packages!athlete_packages_athlete_id_fkey(
          *,
          package:packages!athlete_packages_package_id_fkey(*)
        )
      `
      )
      .order('created_at', { ascending: false })

    // 4. Aplicar filtros de segurança no backend
    if (userRole === 'admin') {
      // Admin pode filtrar por qualquer atlética
      if (filters.athleticId && filters.athleticId !== 'all') {
        query = query.eq('athletic_id', filters.athleticId)
      }
    } else if (userRole === 'athletic') {
      // Atlética SÓ PODE ver seus próprios atletas, ignorando o filtro do client-side
      const athletic = await athleticsService.getByRepresentative(user.id)
      if (!athletic) {
        return [] // Representante sem atlética não vê ninguém
      }
      query = query.eq('athletic_id', athletic.id)
    } else {
      // Outros roles (ex: 'athlete') não devem ver a lista
      return []
    }

    // Filtros de status (seguro, pode ser do client)
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error

    // Formatar e filtrar dados (filtros de UI que não impactam segurança)
    const formattedAthletes =
      data
        ?.map((athlete) => ({
          ...athlete,
          sports: athlete.athlete_sports?.map((as: any) => as.sport).filter(Boolean) || [],
          athlete_packages: athlete.athlete_packages || []
        }))
        .filter((athlete) => {
          // Filtro de busca (client-side)
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase()
            const matchesSearch =
              athlete.user.name.toLowerCase().includes(searchLower) ||
              athlete.user.email.toLowerCase().includes(searchLower) ||
              (athlete.user.phone && athlete.user.phone.includes(filters.searchTerm))

            if (!matchesSearch) return false
          }

          // Filtro de modalidade (client-side)
          if (filters.sportId && filters.sportId !== 'all') {
            const hasSport = athlete.sports.some((sport: any) => sport.id === filters.sportId)
            if (!hasSport) return false
          }

          return true
        }) || []

    // Cache por 3 minutos para listas
    cache.set(cacheKey, formattedAthletes, 3 * 60 * 1000)
    return formattedAthletes
  },

  // Atualizar status do atleta
  async updateStatus(athleteId: string, status: Athlete['status']): Promise<void> {
    const { error } = await supabase.from('athletes').update({ status }).eq('id', athleteId)

    if (error) throw error

    // Invalidar cache relacionado
    invalidateCache.athlete(athleteId)
    invalidateCache.athletesList()
  },

  // Atualizar status WhatsApp
  async updateWhatsAppStatus(athleteId: string, wppSent: boolean): Promise<void> {
    const { error } = await supabase.from('athletes').update({ wpp_sent: wppSent }).eq('id', athleteId)

    if (error) throw error

    // Invalidar cache relacionado
    invalidateCache.athlete(athleteId)
    invalidateCache.athletesList()
  },

  // Atualizar aprovação do admin
  async updateAdminApproval(athleteId: string, isApproved: boolean): Promise<void> {
    // 1. Obter usuário autenticado e sua role
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const userRole = await userService.getRole(user.id)

    // 2. Validar se é admin
    if (userRole !== 'admin') {
      throw new Error('Apenas administradores podem executar esta ação.')
    }

    // 3. Atualizar o campo no banco de dados
    const { error } = await supabase.from('athletes').update({ admin_approved: isApproved }).eq('id', athleteId)

    if (error) throw error

    // 4. Invalidar cache para garantir que a UI seja atualizada
    invalidateCache.athlete(athleteId)
    invalidateCache.athletesList()
  },

  // Invalidar cache de atleta
  invalidateAthlete(athleteId: string) {
    invalidateCache.athlete(athleteId)
  },

  // Invalidar cache de atleta por usuário
  invalidateAthleteByUser(userId: string) {
    invalidateCache.athleteByUser(userId)
  },

  // Invalidar cache de listas
  invalidateList() {
    invalidateCache.athletesList()
  }
}

// Serviço para dados estáticos (cache longo)
export const staticDataService = {
  // Carregar todos os dados estáticos de uma vez
  async loadAll() {
    const [sports, athletics, packages] = await Promise.all([
      sportsService.getAll(),
      athleticsService.getAll(),
      packagesService.getAll()
    ])

    return { sports, athletics, packages }
  },

  // Invalidar todos os dados estáticos
  invalidateAll() {
    invalidateCache.static()
  }
}

// Utilitário para debug do cache
export const cacheDebug = {
  getStats() {
    return cache.getStats()
  },

  clearAll() {
    cache.clear()
  },

  logStats() {
    const stats = cache.getStats()
  }
}
