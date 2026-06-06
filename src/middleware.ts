import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

type CookieRow = { name: string; value: string; options?: Record<string, unknown> }

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? 'demo'
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? ''

function resolveTenantSlug(request: NextRequest): string {
  const host = request.headers.get('host') ?? ''
  const forwardedHost = request.headers.get('x-forwarded-host')

  const effectiveHost = forwardedHost ?? host

  const isLocalhost =
    effectiveHost.includes('localhost') ||
    effectiveHost.includes('127.0.0.1') ||
    effectiveHost.startsWith('localhost:')

  if (isLocalhost) return DEFAULT_TENANT

  if (effectiveHost.includes('vercel.app')) return DEFAULT_TENANT

  if (BASE_DOMAIN && effectiveHost.endsWith(BASE_DOMAIN)) {
    const subdomain = effectiveHost.replace(`.${BASE_DOMAIN}`, '').split('.')[0]
    if (subdomain && subdomain !== 'www') {
      return subdomain
    }
    return DEFAULT_TENANT
  }

  const slug = effectiveHost.split('.')[0]
  if (!slug || slug === 'www') return DEFAULT_TENANT

  if (forwardedHost && !forwardedHost.includes('vercel.app')) {
    const customDomainSlug = effectiveHost.replace(/:\d+$/, '').replace(/\./g, '-')
    return `custom:${customDomainSlug}`
  }

  return slug
}

export async function middleware(request: NextRequest) {
  const tenantSlug = resolveTenantSlug(request)

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
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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
    .select('role, empresa_id')
    .eq('id', user.id)
    .maybeSingle()

  const role = perfil?.role as string | undefined
  const empresaId = perfil?.empresa_id as string | undefined

  if (pathname.startsWith('/admin') && role && role !== 'master' && empresaId) {
    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('status')
      .eq('empresa_id', empresaId)
      .maybeSingle()
    if (assinatura?.status === 'inadimplente' && !pathname.startsWith('/admin/configuracoes')) {
      return NextResponse.redirect(new URL('/admin/configuracoes?inadimplente=1', request.url))
    }
  }

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
