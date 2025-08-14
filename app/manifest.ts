import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JISC 2025 - Jogos Interuniversitários Sociais e Culturais',
    short_name: 'JISC 2025',
    description: 'Maior campeonato universitário do Brasil com competições esportivas e jogos de boteco',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#C200F7',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'pt-BR',
    categories: ['sports', 'education', 'entertainment'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow'
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide'
      }
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Acesse o painel de controle',
        url: '/dashboard',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192'
          }
        ]
      },
      {
        name: 'Atletas',
        short_name: 'Atletas',
        description: 'Gerencie atletas',
        url: '/dashboard/athletes',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192'
          }
        ]
      },
      {
        name: 'Cadastro',
        short_name: 'Cadastro',
        description: 'Inscreva-se no JISC',
        url: '/register',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192'
          }
        ]
      }
    ]
  }
}
