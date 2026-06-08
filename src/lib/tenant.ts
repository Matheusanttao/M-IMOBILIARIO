import { cookies } from 'next/headers'
import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'

export type PublicEmpresa = {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  whatsapp: string | null
  email: string | null
  cidade: string | null
  estado: string | null
  financiamento_url: string | null
  quem_somos_titulo: string | null
  quem_somos_texto: string | null
  politica_privacidade_titulo: string | null
  politica_privacidade_texto: string | null
}

const PUBLIC_EMPRESA_SELECT =
  'id,nome,slug,logo_url,whatsapp,email,cidade,estado,financiamento_url,quem_somos_titulo,quem_somos_texto,politica_privacidade_titulo,politica_privacidade_texto'

export async function getPublicEmpresa(): Promise<PublicEmpresa | null> {
  if (!isServerSupabaseConfigured()) return null

  const supabase = await createServerSupabaseClient()
  const cookieStore = await cookies()
  const tenantSlug = cookieStore.get('tenant_slug')?.value?.trim()

  if (tenantSlug) {
    const { data } = await supabase
      .from('empresas')
      .select(PUBLIC_EMPRESA_SELECT)
      .eq('slug', tenantSlug)
      .eq('ativa', true)
      .maybeSingle()

    if (data) return data as PublicEmpresa
  }

  const { data } = await supabase
    .from('empresas')
    .select(PUBLIC_EMPRESA_SELECT)
    .eq('ativa', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (data as PublicEmpresa | null) ?? null
}
