import { IAthleteService } from '@/domain/athletes/ports'
import { athleteService as sdk } from '@/lib/services' // seu serviço atual

export const AthleteServiceSupabase: IAthleteService = {
  async updateStatus(id, status) {
    await sdk.updateStatus(id, status)
  },
  async updateWhatsAppStatus(id, sent) {
    await sdk.updateWhatsAppStatus(id, sent)
  },
  async updateAdminApproval(id, isApproved) {
    await sdk.updateAdminApproval(id, isApproved)
  }
}
