import AuthProvider from '@/components/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import type React from 'react'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'JISC 2025 - Jogos Interuniversitários Sociais e Culturais',
    template: '%s | JISC 2025'
  },
  description:
    'Participe do maior campeonato universitário do Brasil! JISC 2025 - Jogos Interuniversitários Sociais e Culturais. Competições esportivas, jogos de boteco e muito mais. Inscreva-se agora!',
  keywords: [
    'JISC',
    'JISC 2025',
    'campeonato universitário',
    'jogos universitários',
    'esportes universitários',
    'competição universitária',
    'universidade',
    'atlética',
    'esportes',
    'boteco',
    'competição'
  ],
  authors: [{ name: 'JISC Organization', url: 'https://jisc.com.br' }],
  creator: 'JISC Organization',
  publisher: 'JISC Organization',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL('https://jisc.com.br'),
  alternates: {
    canonical: '/'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://jisc.com.br',
    title: 'JISC 2025 - Jogos Interuniversitários Sociais e Culturais',
    description:
      'Participe do maior campeonato universitário do Brasil! Competições esportivas, jogos de boteco e muito mais. Inscreva-se agora!',
    siteName: 'JISC 2025',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JISC 2025 - Jogos Interuniversitários Sociais e Culturais'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JISC 2025 - Jogos Interuniversitários Sociais e Culturais',
    description:
      'Participe do maior campeonato universitário do Brasil! Competições esportivas, jogos de boteco e muito mais.',
    images: ['/og-image.jpg'],
    creator: '@jisc2025',
    site: '@jisc2025'
  },
  other: {
    'theme-color': '#0456FC',
    'msapplication-TileColor': '#0456FC',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'JISC 2025',
    'mobile-web-app-capable': 'yes',
    'msapplication-tap-highlight': 'no'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0456FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0456FC' }
  ]
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='pt-BR' className={inter.variable}>
      <head>
        <meta name='format-detection' content='telephone=no' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='JISC' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='msapplication-TileColor' content='#0456FC' />
        <meta name='msapplication-tap-highlight' content='no' />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      </head>
      <body className={inter.className}>
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          Pular para o conteúdo principal
        </a>

        <AuthProvider>
          <ThemeProvider attribute='class' defaultTheme='light' enableSystem={false} disableTransitionOnChange>
            <div id='main-content'>{children}</div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>

        <div id='announcements' aria-live='polite' aria-atomic='true' className='sr-only' />
      </body>
    </html>
  )
}
