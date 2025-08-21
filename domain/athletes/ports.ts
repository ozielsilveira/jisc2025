import { Athlete } from './entities'

export interface IAthleteService {
  updateStatus(athleteId: string, status: 'approved' | 'rejected'): Promise<void>
  updateWhatsAppStatus(athleteId: string, sent: boolean): Promise<void>
}
