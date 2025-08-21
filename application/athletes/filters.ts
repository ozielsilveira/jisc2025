import { Athlete, SortField, SortOrder } from '@/domain/athletes/entities'

export type UiFilters = {
  searchTerm: string
  athleticId: string | 'all'
  status: 'all' | Athlete['status']
  sportId: string | 'all'
  whatsapp: 'all' | 'sent' | 'not_sent'
}

export function applyFilters(list: Athlete[], f: UiFilters): Athlete[] {
  const st = f.searchTerm?.toLowerCase() ?? ''
  return list.filter((a) => {
    const matchesSearch =
      !st ||
      a.user.name.toLowerCase().includes(st) ||
      a.user.email.toLowerCase().includes(st) ||
      a.user.phone.includes(f.searchTerm)
    const matchesAthletic = f.athleticId === 'all' || a.athletic_id === f.athleticId
    const matchesStatus = f.status === 'all' || a.status === f.status
    const matchesSport = f.sportId === 'all' || a.sports.some((s) => s.id === f.sportId)
    const matchesWpp = f.whatsapp === 'all' || (f.whatsapp === 'sent' ? a.wpp_sent : !a.wpp_sent)
    return matchesSearch && matchesAthletic && matchesStatus && matchesSport && matchesWpp
  })
}

export function sortAthletes(list: Athlete[], field: SortField, order: SortOrder): Athlete[] {
  const sorted = [...list].sort((a, b) => {
    const pick = (x: Athlete) => {
      switch (field) {
        case 'name':
          return x.user.name.toLowerCase()
        case 'created_at':
          return new Date(x.created_at).getTime()
        case 'status':
          return x.status
        case 'athletic':
          return x.athletic.name.toLowerCase()
      }
    }
    const av = pick(a)
    const bv = pick(b)
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })
  return sorted
}
