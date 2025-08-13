'use client'

import { useAthletics, useSports, useStaticData, useUserData } from '@/hooks/use-cached-data'
import { athleteService, invalidateCache } from '@/lib/services'
import React from 'react'

// Exemplo 1: Usando hooks com cache
export const UserProfileExample = () => {
  const { profile, loading, error, refetch } = useUserData()
  const { sports } = useSports()

  if (loading) return <div>Carregando perfil...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <h2>Perfil do Usuário</h2>
      <p>Nome: {profile?.name}</p>
      <p>Email: {profile?.email}</p>
      <p>Modalidades disponíveis: {sports.length}</p>

      <button onClick={refetch}>Atualizar dados</button>
    </div>
  )
}

// Exemplo 2: Usando serviços diretamente
export const AthleteManagementExample = () => {
  const [athleteId, setAthleteId] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)

  const handleApproveAthlete = async () => {
    if (!athleteId) return

    setLoading(true)
    try {
      // O serviço automaticamente invalida o cache
      await athleteService.updateStatus(athleteId, 'approved')
      console.log('Atleta aprovado com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar atleta:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvalidateCache = () => {
    // Invalidar cache manualmente
    invalidateCache.athlete(athleteId)
    console.log('Cache do atleta invalidado')
  }

  return (
    <div>
      <h2>Gerenciamento de Atletas</h2>
      <input type='text' value={athleteId} onChange={(e) => setAthleteId(e.target.value)} placeholder='ID do atleta' />
      <button onClick={handleApproveAthlete} disabled={loading}>
        {loading ? 'Aprovando...' : 'Aprovar Atleta'}
      </button>
      <button onClick={handleInvalidateCache}>Invalidar Cache</button>
    </div>
  )
}

// Exemplo 3: Usando dados estáticos com cache
export const StaticDataExample = () => {
  const { sports, athletics, packages, loading, error } = useStaticData()

  if (loading) return <div>Carregando dados...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <h2>Dados Estáticos</h2>

      <div>
        <h3>Modalidades ({sports.length})</h3>
        <ul>
          {sports.map((sport) => (
            <li key={sport.id}>
              {sport.name} - {sport.type}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Atléticas ({athletics.length})</h3>
        <ul>
          {athletics.map((athletic) => (
            <li key={athletic.id}>
              {athletic.name} - {athletic.university}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Pacotes ({packages.length})</h3>
        <ul>
          {packages.map((pkg) => (
            <li key={pkg.id}>
              {pkg.name} - R$ {pkg.price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Exemplo 4: Componente com múltiplos hooks
export const DashboardExample = () => {
  const { profile } = useUserData()
  const { athletics } = useAthletics()
  const { sports } = useSports()

  return (
    <div>
      <h2>Dashboard</h2>

      <div>
        <h3>Bem-vindo, {profile?.name}!</h3>
        <p>Role: {profile?.role}</p>
      </div>

      <div>
        <h3>Estatísticas</h3>
        <p>Atléticas cadastradas: {athletics.length}</p>
        <p>Modalidades disponíveis: {sports.length}</p>
      </div>
    </div>
  )
}

// Exemplo 5: Hook personalizado com cache
export const useAthleteStats = (athleteId?: string) => {
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchStats = React.useCallback(async () => {
    if (!athleteId) return

    setLoading(true)
    try {
      // Aqui você poderia implementar lógica específica
      // usando os serviços com cache
      const athlete = await athleteService.getById(athleteId)
      setStats({
        sportsCount: athlete?.sports.length || 0,
        packagesCount: athlete?.athlete_packages?.length || 0,
        status: athlete?.status
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }, [athleteId])

  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, refetch: fetchStats }
}

// Exemplo 6: Componente usando hook personalizado
export const AthleteStatsExample = ({ athleteId }: { athleteId: string }) => {
  const { stats, loading } = useAthleteStats(athleteId)

  if (loading) return <div>Carregando estatísticas...</div>

  return (
    <div>
      <h3>Estatísticas do Atleta</h3>
      <p>Modalidades: {stats?.sportsCount}</p>
      <p>Pacotes: {stats?.packagesCount}</p>
      <p>Status: {stats?.status}</p>
    </div>
  )
}

// Exemplo 7: Debug e monitoramento
export const CacheDebugExample = () => {
  const [debugInfo, setDebugInfo] = React.useState<any>(null)

  const showDebugInfo = () => {
    // Importar dinamicamente para evitar problemas em produção
    import('@/lib/services').then(({ cacheDebug }) => {
      setDebugInfo(cacheDebug.getStats())
    })
  }

  const clearAllCache = () => {
    import('@/lib/services').then(({ cacheDebug }) => {
      cacheDebug.clearAll()
      showDebugInfo()
    })
  }

  return (
    <div>
      <h2>Debug do Cache</h2>
      <button onClick={showDebugInfo}>Mostrar Info</button>
      <button onClick={clearAllCache}>Limpar Cache</button>

      {debugInfo && <pre>{JSON.stringify(debugInfo, null, 2)}</pre>}
    </div>
  )
}
