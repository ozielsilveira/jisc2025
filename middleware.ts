import { NextResponse, type NextRequest } from 'next/server'
import { supabase } from './lib/supabase'

const MAINTENANCE_MODE_ENABLED = process.env.MAINTENANCE_MODE === 'true' || false

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Recupera a sessão do Supabase
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  // Verifica se houve erro ao tentar recuperar a sessão
  if (error || !session) {
    if (!req.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }

  const isMaintenancePage = req.nextUrl.pathname.startsWith('/maintenance')
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isLandingPage = req.nextUrl.pathname === '/'

  // Verifica o domínio de acesso
  const isJiscDomain = req.nextUrl.hostname === 'jisc.com.br' || req.nextUrl.hostname === 'www.jisc.com.br'
  const isJisc2025VercelApp = req.nextUrl.hostname === 'jisc2025.vercel.app'

  if (MAINTENANCE_MODE_ENABLED) {
    // Se o domínio for jisc.com.br ou www.jisc.com.br, redireciona para a manutenção
    if (isJiscDomain && !isMaintenancePage) {
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }

    // Se for a página inicial, permite o acesso
    if (isLandingPage) {
      return res
    }

    // Verifica se o email do usuário é o do admin
    const userEmail = session.user.email
    const isAdmin = userEmail === 'jisc@gmail.com' // Troque pelo email ou id do admin que você deseja

    if (isAdmin) {
      return res // Admin não será redirecionado para manutenção
    }
  } else if (isMaintenancePage) {
    // Se o modo de manutenção não estiver habilitado, redireciona de volta para a landing page
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Permite o acesso ao domínio 'jisc2025.vercel.app'
  if (isJisc2025VercelApp) {
    return res
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
