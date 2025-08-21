import AuthProvider from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'JISC 2025',
  description: 'Jornada de Inovação e Sustentabilidade Corporativa',
  icons: {
    icon: '/LOGO desenho.svg',
    shortcut: '/LOGO desenho.svg',
    apple: '/LOGO desenho.svg',
  },
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='pt-BR' className={inter.variable}>
      <body>
        <ThemeProvider attribute='class' defaultTheme='light' enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <div id='main-content'>{children}</div>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
