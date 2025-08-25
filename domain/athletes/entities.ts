export type AthleteStatus = 'pending' | 'sent' | 'approved' | 'rejected'

export type SportType = 'sport' | 'boteco'

export interface Athlete {
  id: string
  user_id: string
  athletic_id: string
  enrollment_document_url: string
  status: AthleteStatus
  created_at: string
  cnh_cpf_document_url: string
  wpp_sent: boolean
  admin_approved: boolean | null
  user: { name: string; email: string; cpf: string; phone: string; gender: string }
  athletic: { name: string }
  sports: Array<{ id: string; name: string; type: SportType }>
  athlete_packages?: Array<{
    id: string
    package: { id: string; name: string; price: number; description: string }
    payment_status: string
  }>
}

export interface Athletic {
  id: string
  name: string
  university: string
}

export interface Sport {
  id: string
  name: string
  type: SportType
}

export interface Package {
  id: string
  name: string
  price: number
  description: string
}

export type SortField = 'name' | 'created_at' | 'status' | 'athletic'
export type SortOrder = 'asc' | 'desc'
