import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieRow = { name: string; value: string; options?: Record<string, unknown> }

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
      })
    }
  })
}

export async function GET(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url)
  const response = NextResponse.redirect(loginUrl)

  response.cookies.set('tenant_slug', '', {
    path: '/',
    maxAge: 0,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url?.trim() || !key?.trim()) {
    clearSupabaseCookies(request, response)
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

  await supabase.auth.signOut()
  clearSupabaseCookies(request, response)

  return response
}

export const POST = GET
