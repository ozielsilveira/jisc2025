'use server'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Athlete } from '@/domain/athletes/entities'

// Initialize the service role client here, inside the server-only file.
// This ensures the service role key is never exposed to the client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  // Log the error on the server, but don't expose details to the client.
  console.error('Missing Supabase service role environment variables')
}

// Create a new Supabase client with the service role key
const supabaseAdmin = createClient<Database>(supabaseUrl!, serviceRoleKey!)

export async function updateAthleteDocument(
  athleteId: string,
  fileType: 'document' | 'enrollment',
  newUrl: string
): Promise<{ success: boolean; message?: string }> {
  if (!athleteId || !fileType || !newUrl) {
    return { success: false, message: 'Parâmetros inválidos.' }
  }

  // Ensure the admin client is available
  if (!supabaseAdmin) {
    return { success: false, message: 'Configuração do servidor incompleta.' }
  }

  const updateData: Partial<Omit<Athlete, 'id' | 'user_id'>> = {
    status: 'sent'
  }

  if (fileType === 'document') {
    updateData.cnh_cpf_document_url = newUrl
  } else {
    updateData.enrollment_document_url = newUrl
  }

  try {
    const { error } = await supabaseAdmin.from('athletes').update(updateData).eq('id', athleteId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error updating athlete document with admin client:', error)
    return { success: false, message: error.message || 'Erro ao atualizar o documento do atleta.' }
  }
}
