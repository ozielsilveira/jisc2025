import { Athlete } from './entities'

export interface IAthleteService {
  updateStatus(athleteId: string, status: 'approved' | 'rejected'): Promise<void>
  updateWhatsAppStatus(athleteId: string, sent: boolean): Promise<void>
  updateAdminApproval: (id: string, isApproved: boolean) => Promise<void>
}
