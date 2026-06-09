import { cookies } from 'next/headers'
import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'

export type FinanciamentoLink = {
  titulo: string
  url: string
}

export type PublicEmpresa = {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  whatsapp: string | null
  email: string | null
  cidade: string | null
  estado: string | null
  financiamento_url?: string | null
  financiamentos?: unknown
  quem_somos_titulo?: string | null
  quem_somos_texto?: string | null
  quem_somos_imagem_url?: string | null
  politica_privacidade_titulo?: string | null
  politica_privacidade_texto?: string | null
}

const PUBLIC_EMPRESA_SELECT =
  'id,nome,slug,logo_url,whatsapp,email,cidade,estado,financiamentos,quem_somos_titulo,quem_somos_texto,quem_somos_imagem_url,politica_privacidade_titulo,politica_privacidade_texto'
const PUBLIC_EMPRESA_BASE_SELECT =
  'id,nome,slug,logo_url,whatsapp,email,cidade,estado'

const PLACEHOLDER_TENANT_SLUGS = new Set([
  'slug-da-imobiliaria',
  'sua-imobiliaria',
  'minha-imobiliaria',
])

function normalizeTenantSlug(value?: string | null): string {
  const slug = value?.trim().toLowerCase() ?? ''
  return PLACEHOLDER_TENANT_SLUGS.has(slug) ? '' : slug
}

async function maybeSingleEmpresa(
  buildQuery: (select: string) => any,
): Promise<PublicEmpresa | null> {
  const { data, error } = await buildQuery(PUBLIC_EMPRESA_SELECT).maybeSingle()
  if (!error) return (data as PublicEmpresa | null) ?? null

  const { data: fallbackData, error: fallbackError } = await buildQuery(
    PUBLIC_EMPRESA_BASE_SELECT,
  ).maybeSingle()
  if (fallbackError) return null
  return (fallbackData as PublicEmpresa | null) ?? null
}

async function fetchEmpresaBySlug(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  slug: string,
) {
  return maybeSingleEmpresa(
    (select) =>
      supabase
        .from('empresas')
        .select(select)
        .eq('slug', slug)
      .eq('ativa', true),
  )
}

async function fetchEmpresaFromLoggedUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!perfil?.empresa_id) return null

  return maybeSingleEmpresa(
    (select) =>
      supabase
        .from('empresas')
        .select(select)
        .eq('id', perfil.empresa_id)
      .eq('ativa', true),
  )
}

export function normalizePublicFinanciamentos(
  value: unknown,
  fallbackUrl?: string | null,
): FinanciamentoLink[] {
  if (Array.isArray(value)) {
    const rows = value
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const titulo = typeof row.titulo === 'string' ? row.titulo.trim() : ''
        const url = typeof row.url === 'string' ? row.url.trim() : ''
        return titulo && url ? { titulo, url } : null
      })
      .filter((item): item is FinanciamentoLink => Boolean(item))
    if (rows.length) return rows
  }

  if (fallbackUrl?.trim()) {
    return [{ titulo: 'Simular financiamento', url: fallbackUrl.trim() }]
  }

  return []
}

export async function getPublicEmpresa(): Promise<PublicEmpresa | null> {
  if (!isServerSupabaseConfigured()) return null

  const supabase = await createServerSupabaseClient()
  const cookieStore = await cookies()
  const configuredSlug = normalizeTenantSlug(process.env.NEXT_PUBLIC_TENANT_SLUG)
  const cookieSlug = normalizeTenantSlug(cookieStore.get('tenant_slug')?.value)
  const tenantSlug = configuredSlug || cookieSlug

  if (tenantSlug) {
    const empresa = await fetchEmpresaBySlug(supabase, tenantSlug)
    if (empresa) return empresa

    const loggedUserEmpresa = await fetchEmpresaFromLoggedUser(supabase)
    if (loggedUserEmpresa) return loggedUserEmpresa

    if (configuredSlug) return null
  }

  const empresa = await maybeSingleEmpresa(
    (select) =>
      supabase
        .from('empresas')
        .select(select)
        .eq('ativa', true)
        .order('created_at', { ascending: true })
      .limit(1),
  )

  return empresa
}
