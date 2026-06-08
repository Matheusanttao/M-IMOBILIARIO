import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types'

type CookieRow = { name: string; value: string; options?: Record<string, unknown> }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_ROLES: UserRole[] = [
  'admin',
  'gerente',
  'corretor',
  'financeiro',
  'captador',
  'atendente',
]

function isAllowedRole(role: unknown): role is UserRole {
  return typeof role === 'string' && ALLOWED_ROLES.includes(role as UserRole)
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Convite de equipe não configurado no servidor.' },
      { status: 503 },
    )
  }

  const body = (await request.json()) as {
    nome?: unknown
    email?: unknown
    role?: unknown
    creci?: unknown
    telefone?: unknown
  }

  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = body.role

  if (!nome || !email || !isAllowedRole(role)) {
    return NextResponse.json({ error: 'Dados do membro inválidos.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieRow[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as never),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 })
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('empresa_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (perfilError || !perfil?.empresa_id) {
    return NextResponse.json({ error: 'Perfil de usuário não encontrado.' }, { status: 403 })
  }

  if (!['admin', 'gerente', 'master'].includes(String(perfil.role))) {
    return NextResponse.json({ error: 'Sem permissão para convidar membros.' }, { status: 403 })
  }

  const admin = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { data: { full_name: nome, role } },
  )

  if (inviteError || !invite.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? 'Não foi possível criar o convite.' },
      { status: 400 },
    )
  }

  const { error: upsertError } = await admin.from('usuarios').upsert({
    id: invite.user.id,
    empresa_id: perfil.empresa_id,
    nome,
    email,
    role,
    creci: typeof body.creci === 'string' && body.creci.trim() ? body.creci.trim() : null,
    telefone:
      typeof body.telefone === 'string' && body.telefone.trim()
        ? body.telefone.trim()
        : null,
    ativo: true,
  })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
