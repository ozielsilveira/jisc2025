import type { Metadata, ResolvingMetadata } from 'next'
import { supabase } from '@/lib/supabase'

type Props = {
  children: React.ReactNode
  params: {}
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  console.log('SearchParams recebidos:', searchParams);
  
  const type = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type
  const athleticId = Array.isArray(searchParams.athletic) ? searchParams.athletic[0] : searchParams.athletic
  const source = Array.isArray(searchParams.source) ? searchParams.source[0] : searchParams.source
  
  console.log('Valores extraídos:', { type, athleticId, source });
  
  let title = 'Cadastro - JISC 2025'
  let description = 'Cadastre-se no JISC 2025! Inscreva-se como atleta, representante de atlética ou compre ingressos para o maior campeonato universitário do Brasil.'
  
  // Fetch athletic data if athleticId is provided
  if (athleticId && type) {
    try {
      const { data: athletic } = await supabase
        .from('athletics')
        .select('name, university, logo_url')
        .eq('id', athleticId)
        .single()
      
      if (athletic) {
        const baseTitle = type === 'athlete' 
          ? `Inscreva-se como atleta da ${athletic.name} - JISC 2025`
          : `Cadastre a ${athletic.name} - JISC 2025`
        
        const baseDescription = type === 'athlete'
          ? `Faça parte do time da ${athletic.name} no JISC 2025! Inscreva-se agora como atleta.`
          : `Cadastre a ${athletic.name} da ${athletic.university} no JISC 2025!`
        
        title = baseTitle
        description = baseDescription
      }
    } catch (error) {
      console.error('Error fetching athletic data:', error)
    }
  }

  console.log('Gerando metadados com:', { title, description });
  
  const metadata: Metadata = {
    title,
    description,
    keywords: [
      'cadastro JISC',
      'inscrição atleta',
      'cadastro atlética',
      'comprar ingressos JISC',
      'registro JISC 2025',
      'inscrições campeonato universitário'
    ],
    openGraph: {
      title,
      description,
      url: 'https://jisc.com.br/register' + 
        (type ? `?type=${type}` : '') + 
        (athleticId ? `&athletic=${athleticId}` : '') +
        (source ? `&source=${source}` : ''),
      siteName: 'JISC 2025',
      locale: 'pt_BR',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@jisc2025',
      site: '@jisc202'
    },
    alternates: {
      canonical: 'https://jisc.com.br/register' + 
        (type ? `?type=${type}` : '') + 
        (athleticId ? `&athletic=${athleticId}` : '') +
        (source ? `&source=${source}` : '')
    }
  }

  console.log('Metadados finais:', JSON.stringify(metadata, null, 2));
  return metadata
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}