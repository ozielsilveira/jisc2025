import { NextResponse, type NextRequest } from 'next/server'
import { supabase } from './lib/supabase'

const MAINTENANCE_MODE_ENABLED = process.env.MAINTENANCE_MODE === 'true' || false

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const isMaintenancePage = req.nextUrl.pathname.startsWith('/maintenance')
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isLandingPage = req.nextUrl.pathname === '/'

  if (MAINTENANCE_MODE_ENABLED) {
    if (isMaintenancePage) {
      return res
    }

    if (isLandingPage) {
      return res
    }

    const userRole = session?.user?.user_metadata?.role ?? null
    const isAdmin = userRole === 'admin'

    if (!isAdmin) {
      if (isLoginPage) {
        return res
      }
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }
  } else if (isMaintenancePage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
