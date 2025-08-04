import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verifica se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return new NextResponse('Não autorizado', { status: 401 })
    }

    // Obtém o caminho completo do arquivo
    const filePath = params.path.join('/')
    
    // Verifica se o usuário tem permissão para acessar o arquivo
    const userId = session.user.id
    if (!filePath.startsWith(userId + '/')) {
      return new NextResponse('Acesso não autorizado a este recurso', { status: 403 })
    }

    // Obtém a URL assinada para o arquivo
    const { data: { publicUrl } } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath)

    // Redireciona para a URL assinada
    return NextResponse.redirect(publicUrl)
  } catch (error) {
    console.error('Erro ao acessar documento:', error)
    return new NextResponse('Erro ao acessar o documento', { status: 500 })
  }
}
