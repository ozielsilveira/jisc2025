// src/services/dashboardService.ts
import { supabase } from '@/lib/supabase'

export const dashboardService = {
  async fetchUser(id: string) {
    const { data, error } = await supabase.from('users').select('id, name, role').eq('id', id).single()
    if (error) throw error
    return data as { id: string; name: string; role: 'buyer' | 'athlete' | 'athletic' | 'admin' } | null
  },

  async fetchGeneralStats() {
    const [{ count: athletes }, { count: athletics }, { count: sports }] = await Promise.all([
      supabase.from('athletes').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('athletics').select('*', { count: 'exact', head: true }),
      supabase.from('sports').select('*', { count: 'exact', head: true })
    ])
    return {
      totalParticipants: athletes || 0,
      athleticCounter: athletics || 0,
      sportsAvailable: sports || 0
    }
  },

  async fetchHighlights(): Promise<
    Array<{
      id: string
      title: string
      description: string
      date: string
      location: string
      image: string
      type: 'game' | 'event' | 'news'
      featured: boolean
    }>
  > {
    // Por ora retorna destaques estáticos; pode ser estendido futuramente
    return [
      {
        id: 'welcome',
        title: 'Bem-vindo ao JISC 2025!',
        description: 'O maior campeonato universitário está acontecendo. Participe e mostre seu talento!',
        date: 'Evento em andamento',
        location: 'Campus Universitário',
        image: '/festa1.jpg?height=300&width=500&text=JISC+2025',
        type: 'event',
        featured: true
      },
      {
        id: 'registration',
        title: 'Inscrições Abertas',
        description: 'Cadastre-se como atleta e participe das modalidades disponíveis.',
        date: 'Até 29/08/2025',
        location: 'Online',
        image: '/trofeu.jpg?height=300&width=500&text=Inscricoes+Abertas',
        type: 'news',
        featured: false
      }
    ]
  }
}
