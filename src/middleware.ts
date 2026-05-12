import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

type CookieRow = { name: string; value: string; options?: Record<string, unknown> }

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? 'demo'

function resolveTenantSlug(host: string): string {
  const slug = host.split('.')[0]
  const isLocalhost =
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.startsWith('localhost:')
  if (
    isLocalhost ||
    !slug ||
    slug === 'www' ||
    host.includes('vercel.app')
  ) {
    return DEFAULT_TENANT
  }
  return slug
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const tenantSlug = resolveTenantSlug(host)

  const response = await updateSession(request)
  response.headers.set('x-tenant-slug', tenantSlug)
  response.cookies.set('tenant_slug', tenantSlug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const { pathname } = request.nextUrl

  const isAdminLogin = pathname.startsWith('/admin/login')
  if (isAdminLogin) {
    return response
  }

  const needsAuth = pathname.startsWith('/admin') || pathname.startsWith('/master')
  if (!needsAuth) {
    return response
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url?.trim() || !key?.trim()) {
    return response
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieRow[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as never)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const login = new URL('/admin/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = perfil?.role as string | undefined

  if (pathname.startsWith('/master') && role !== 'master') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  if (pathname.startsWith('/admin') && !role) {
    const login = new URL('/admin/login', request.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
