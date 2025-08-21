// src/hooks/useResponsiveSidebar.ts
import { useEffect } from 'react'

export function useResponsiveSidebar(setIsMobileMenuOpen: (open: boolean) => void) {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (window.innerWidth >= 768) {
          setIsMobileMenuOpen(false)
        }
      }, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [setIsMobileMenuOpen])
}
