import type { Metadata } from 'next'
import Home from '@/components/landing-page'

export const metadata: Metadata = {
  title: 'JISC 2025 - Maior Campeonato Universitário do Sul do Brasil | Cadastre sua Atlética',
  description:
    'Participe do JISC 2025, o maior evento esportivo universitário da região sul. Mais de 500 atletas, 50+ modalidades esportivas e 20+ universidades. Cadastre sua atlética agora!',
  keywords: [
    'JISC 2025',
    'Jogos Integrados Santa Catarina',
    'campeonato universitário',
    'esportes universitários',
    'atlética',
    'universidades sul brasil',
    'competição esportiva',
    'jogos universitários',
    'Santa Catarina',
    'cadastro atlética'
  ],
  authors: [{ name: 'JISC 2025' }],
  creator: 'JISC 2025',
  publisher: 'JISC 2025',
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
    siteName: 'JISC 2025',
    title: 'JISC 2025 - Maior Campeonato Universitário do Sul do Brasil',
    description:
      'Participe do JISC 2025, o maior evento esportivo universitário da região sul. Mais de 500 atletas, 50+ modalidades esportivas e 20+ universidades.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JISC 2025 - Jogos Integrados de Santa Catarina'
      }
    ]
  },
  alternates: {
    canonical: 'https://jisc.com.br'
  },
  category: 'Sports',
  classification: 'University Sports Championship',
  other: {
    'application-name': 'JISC 2025',
    'apple-mobile-web-app-title': 'JISC 2025',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2563eb',
    'theme-color': '#2563eb'
  }
}

export default function Page() {
  return <Home />
}
