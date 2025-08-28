// Sistema de cache em memória para reduzir consultas desnecessárias
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live em milissegundos
}

interface CacheConfig {
  defaultTTL: number // 5 minutos por padrão
  maxSize: number // Máximo de itens no cache
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 100,
      ...config
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Limpar cache se exceder o tamanho máximo
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup()
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    }

    this.cache.set(key, item)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) return null

    // Verificar se o item expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Limpar cache por padrão a cada 5 minutos
  startCleanupInterval(): void {
    setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    )
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Instância global do cache
export const cache = new MemoryCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 200
})

// Iniciar limpeza automática
if (typeof window !== 'undefined') {
  cache.startCleanupInterval()
}

// Chaves de cache padronizadas
export const CACHE_KEYS = {
  // Dados estáticos
  SPORTS: 'sports',
  ATHLETICS: 'athletics',
  PACKAGES: 'packages',

  // Dados de usuário
  USER_PROFILE: (userId: string) => `user_profile_${userId}`,
  USER_ROLE: (userId: string) => `user_role_${userId}`,

  // Dados de atletas
  ATHLETE: (athleteId: string) => `athlete_${athleteId}`,
  ATHLETE_BY_USER: (userId: string) => `athlete_by_user_${userId}`,
  ATHLETE_SPORTS: (athleteId: string) => `athlete_sports_${athleteId}`,
  ATHLETE_PACKAGES: (athleteId: string) => `athlete_packages_${athleteId}`,

  // Listas filtradas
  ATHLETES_LIST: (filters: string) => `athletes_list_${filters}`,
  ATHLETES_BY_ATHLETIC: (athleticId: string) => `athletes_by_athletic_${athleticId}`,

  // Dados de atlética
  ATHLETIC_BY_REPRESENTATIVE: (representativeId: string) => `athletic_by_representative_${representativeId}`
} as const

// Utilitários para invalidação de cache
export const invalidateCache = {
  // Invalidar dados de um usuário específico
  user: (userId: string) => {
    cache.delete(CACHE_KEYS.USER_PROFILE(userId))
    cache.delete(CACHE_KEYS.USER_ROLE(userId))
    cache.delete(CACHE_KEYS.ATHLETE_BY_USER(userId))
  },

  // Invalidar dados de um atleta específico
  athlete: (athleteId: string) => {
    cache.delete(CACHE_KEYS.ATHLETE(athleteId))
    cache.delete(CACHE_KEYS.ATHLETE_SPORTS(athleteId))
    cache.delete(CACHE_KEYS.ATHLETE_PACKAGES(athleteId))
  },

  // Invalidar dados de um atleta por usuário
  athleteByUser: (userId: string) => {
    cache.delete(CACHE_KEYS.ATHLETE_BY_USER(userId))
    // Also invalidate any athlete entries that might reference this user
    const stats = cache.getStats()
    stats.keys.forEach((key) => {
      if (key.startsWith('athlete_') && key.includes(userId)) {
        cache.delete(key)
      }
    })
  },

  // Invalidar listas de atletas
  athletesList: () => {
    const stats = cache.getStats()
    stats.keys.forEach((key) => {
      if (key.startsWith('athletes_list_') || key.startsWith('athletes_by_athletic_')) {
        cache.delete(key)
      }
    })
  },

  // Invalidar dados estáticos
  static: () => {
    cache.delete(CACHE_KEYS.SPORTS)
    cache.delete(CACHE_KEYS.ATHLETICS)
    cache.delete(CACHE_KEYS.PACKAGES)
  },

  // Invalidar tudo
  all: () => {
    cache.clear()
  }
}

// Hook para gerenciar cache com React
export const useCache = <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const fetchData = React.useCallback(async () => {
    // Verificar cache primeiro
    const cached = cache.get<T>(key)
    if (cached) {
      setData(cached)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      cache.set(key, result, ttl)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = React.useCallback(() => {
    cache.delete(key)
    fetchData()
  }, [key, fetchData])

  return { data, loading, error, refetch }
}

// Utilitário para criar chaves de cache com filtros
export const createCacheKey = (baseKey: string, filters: Record<string, any> = {}) => {
  const filterString = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')

  return filterString ? `${baseKey}_${filterString}` : baseKey
}

export default cache
