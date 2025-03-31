'use client'

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'
import * as React from 'react'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('light')
      document.documentElement.style.colorScheme = 'light'
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
