import { createServerClient, type CookieOptions } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

// TODO: Use environment variables for maintenance mode
const MAINTENANCE_MODE_ENABLED = process.env.MAINTENANCE_MODE === 'true' || false

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookies: {
      get: (name: string) => req.cookies.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        req.cookies.set({ name, value, ...options })
        res.cookies.set({ name, value, ...options })
      },
      remove: (name: string, options: CookieOptions) => {
        req.cookies.set({ name, value: '', ...options })
        res.cookies.set({ name, value: '', ...options })
      }
    }
  })

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const isMaintenancePage = req.nextUrl.pathname.startsWith('/maintenance')
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')

  if (MAINTENANCE_MODE_ENABLED) {
    if (isMaintenancePage) {
      return res
    }

    const userRole = session?.user?.user_metadata?.role ?? null
    const isAdmin = userRole === 'admin'

    if (!isAdmin) {
      if (isAuthPage) {
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
