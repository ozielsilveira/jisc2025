// src/hooks/useUserRole.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserRole(userId: string | null) {
  const [role, setRole] = useState<'buyer' | 'athlete' | 'athletic' | 'admin' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setRole(null)
      setIsLoading(false)
      return
    }

    const fetchRole = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from('users').select('role').eq('id', userId).single()
        if (error) throw error
        setRole(data?.role ?? null)
      } catch (err: any) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRole()
  }, [userId])

  return { role, isLoading, error }
}
