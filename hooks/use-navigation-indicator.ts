// src/hooks/useNavigationIndicator.ts
import { useEffect } from 'react'

export function useNavigationIndicator(setIsNavigating: (isNavigating: boolean) => void) {
  useEffect(() => {
    const handleBeforeUnload = () => setIsNavigating(true)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [setIsNavigating])
}
