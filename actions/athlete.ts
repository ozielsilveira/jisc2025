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
): Promise<{ success: boolean; message?: string; data?: any }> {
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
    // First, get the current athlete data to find the user_id for cache invalidation
    const { data: currentAthlete, error: fetchError } = await supabaseAdmin
      .from('athletes')
      .select('user_id')
      .eq('id', athleteId)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Update the athlete document
    const { data, error } = await supabaseAdmin
      .from('athletes')
      .update(updateData)
      .eq('id', athleteId)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    // Return the updated data for immediate UI update
    return { 
      success: true, 
      message: 'Documento atualizado com sucesso.',
      data: data
    }
  } catch (error: any) {
    console.error('Error updating athlete document with admin client:', error)
    return { success: false, message: error.message || 'Erro ao atualizar o documento do atleta.' }
  }
}
