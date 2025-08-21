import type { Metadata } from 'next'
import RegisterClientPage from './page.client'

export const metadata: Metadata = {
  title: 'Cadastro JISC - Maior Campeonato Universitário do Sul do Brasil',
  description:
    'Crie sua conta no JISC para participar do maior campeonato universitário do sul do Brasil, comprar pacotes dos jogos e festas e gerenciar sua atlética.',

  keywords: [
    'JISC',
    'campeonato universitário',
    'sul do Brasil',
    'atlética',
    'esportes universitários',
    'jogos universitários',
    'cadastro',
    'registro',
    'competição esportiva'
  ],

  authors: [{ name: 'JISC - Jogos Integrados de Santa Catarina' }],
  creator: 'JISC',
  publisher: 'JISC',

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

  metadataBase: new URL('https://jisc.com.br/'),

  alternates: {
    canonical: '/register'
  },

  openGraph: {
    title: 'Cadastro JISC - Maior Campeonato Universitário do Sul do Brasil',
    description:
      'Crie sua conta no JISC para participar do maior campeonato universitário do sul do Brasil, comprar pacotes dos jogos e festas e gerenciar sua atlética.',
    url: 'https://jisc.com.br/register',
    siteName: 'JISC',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image-register.jpg',
        width: 1200,
        height: 630,
        alt: 'JISC - Cadastro no maior campeonato universitário do sul do Brasil'
      }
    ]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Cadastro JISC - Maior Campeonato Universitário do Sul do Brasil',
    description:
      'Crie sua conta no JISC para participar do maior campeonato universitário do sul do Brasil, comprar pacotes dos jogos e festas e gerenciar sua atlética.',
    images: ['/og-image-register.jpg'],
    creator: '@jisc_oficial'
  },

  category: 'Sports',
  classification: 'University Sports Championship'
}

export default function RegisterPage() {
  return <RegisterClientPage />
}
