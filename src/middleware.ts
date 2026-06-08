import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

type CookieRow = { name: string; value: string; options?: Record<string, unknown> }

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  response.cookies.delete('tenant_slug')

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
