import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Ignora rotas da API, arquivos estáticos e outros caminhos não relevantes
  if (
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/static') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return res
  }

  // Permite o acesso à página de manutenção
  if (req.nextUrl.pathname === '/maintenance') {
    return res
  }

  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true'

  if (isMaintenanceMode) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options) {
            req.cookies.set({ name, value, ...options })
          },
          remove(name: string, options) {
            req.cookies.set({ name, value: '', ...options })
          }
        }
      }
    )

    const {
      data: { session }
    } = await supabase.auth.getSession()

    let userRole = null
    if (session?.user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (error) {
          throw new Error(`Erro ao buscar role do usuário: ${error.message}`)
        }
        userRole = data?.role
      } catch (error) {
        console.error(error)
        // Em caso de erro ao buscar a role, redireciona para manutenção como precaução
        return NextResponse.redirect(new URL('/maintenance', req.url))
      }
    }

    // Se o usuário não for admin, redireciona para a página de manutenção
    if (userRole !== 'admin') {
      const absoluteURL = new URL('/maintenance', req.nextUrl.origin)
      return NextResponse.redirect(absoluteURL.toString())
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|maintenance).*)']
}
