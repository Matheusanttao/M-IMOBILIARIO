import { createClient } from '@/lib/supabase/client'
import type {
  ImovelInsert,
  ImovelRow,
  ImovelUpdate,
  PropertyListFilters,
  PropertySort,
} from '@/types'
import { PAGE_SIZE } from '@/lib/constants'

export { PAGE_SIZE } from '@/lib/constants'

const IMOVEL_SELECT = `
  *,
  imovel_imagens (*)
`

function applyFilters(
  query: any,
  filters: PropertyListFilters,
) {
  let q = query
  if (filters.purpose) q = q.eq('finalidade', filters.purpose)
  if (filters.city?.trim()) q = q.ilike('cidade', `%${filters.city.trim()}%`)
  if (filters.neighborhood?.trim()) {
    q = q.ilike('bairro', `%${filters.neighborhood.trim()}%`)
  }
  if (filters.type) q = q.eq('tipo', filters.type)
  if (filters.priceMin != null && !Number.isNaN(filters.priceMin)) {
    q = q.gte('preco', filters.priceMin)
  }
  if (filters.priceMax != null && !Number.isNaN(filters.priceMax)) {
    q = q.lte('preco', filters.priceMax)
  }
  if (filters.bedrooms != null && filters.bedrooms > 0) {
    q = q.gte('quartos', filters.bedrooms)
  }
  if (filters.suites != null && filters.suites > 0) {
    q = q.gte('suites', filters.suites)
  }
  if (filters.bathrooms != null && filters.bathrooms > 0) {
    q = q.gte('banheiros', filters.bathrooms)
  }
  if (filters.parking_spaces != null && filters.parking_spaces > 0) {
    q = q.gte('vagas', filters.parking_spaces)
  }
  return q
}

function applySort(
  query: any,
  sort: PropertySort,
) {
  if (sort === 'price_asc') return query.order('preco', { ascending: true })
  if (sort === 'price_desc') return query.order('preco', { ascending: false })
  return query.order('created_at', { ascending: false })
}

export async function getEmpresaIdBySlug(slug: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', slug)
    .eq('ativa', true)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export async function fetchPublicImoveis(params: {
  filters: PropertyListFilters
  sort: PropertySort
  page: number
}): Promise<{ data: ImovelRow[]; count: number | null }> {
  const supabase = createClient()
  const from = (params.page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('imoveis')
    .select(IMOVEL_SELECT, { count: 'exact' })
    .eq('status', 'disponivel')

  query = applyFilters(query, params.filters)
  query = applySort(query, params.sort)
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data as ImovelRow[]) ?? [], count }
}

export async function fetchFeaturedImoveis(
  limit = 6,
): Promise<ImovelRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('imoveis')
    .select(IMOVEL_SELECT)
    .eq('status', 'disponivel')
    .eq('destaque', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  const featured = (data as ImovelRow[]) ?? []
  if (featured.length >= limit) return featured

  const { data: recent, error: recentError } = await supabase
    .from('imoveis')
    .select(IMOVEL_SELECT)
    .eq('status', 'disponivel')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (recentError) throw recentError
  const byId = new Map<string, ImovelRow>()
  featured.forEach((item) => byId.set(item.id, item))
  ;((recent as ImovelRow[]) ?? []).forEach((item) => byId.set(item.id, item))

  return Array.from(byId.values()).slice(0, limit)
}

export async function fetchPublicFilterOptions(): Promise<{
  cities: string[]
  neighborhoods: { city: string; neighborhood: string }[]
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('imoveis')
    .select('cidade, bairro')
    .eq('status', 'disponivel')
    .order('cidade', { ascending: true })
    .order('bairro', { ascending: true })

  if (error) throw error

  const rows = ((data as Pick<ImovelRow, 'cidade' | 'bairro'>[]) ?? []).filter(
    (row) => row.cidade?.trim() && row.bairro?.trim(),
  )
  const cities = Array.from(new Set(rows.map((row) => row.cidade.trim()))).sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  )
  const neighborhoods = Array.from(
    new Map(
      rows.map((row) => {
        const city = row.cidade.trim()
        const neighborhood = row.bairro.trim()
        return [`${city}::${neighborhood}`, { city, neighborhood }] as const
      }),
    ).values(),
  ).sort(
    (a, b) =>
      a.city.localeCompare(b.city, 'pt-BR') ||
      a.neighborhood.localeCompare(b.neighborhood, 'pt-BR'),
  )

  return { cities, neighborhoods }
}

export async function fetchImovelBySlug(
  slug: string,
  options?: { includeHidden?: boolean },
): Promise<ImovelRow | null> {
  const supabase = createClient()
  let query = supabase
    .from('imoveis')
    .select(IMOVEL_SELECT)
    .eq('slug', slug)

  if (!options?.includeHidden) {
    query = query.eq('status', 'disponivel')
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data as ImovelRow | null
}

export async function fetchImovelByIdForAdmin(id: string): Promise<ImovelRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('imoveis')
    .select(IMOVEL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as ImovelRow | null
}

export async function fetchMyImoveis(): Promise<ImovelRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('imoveis')
    .select(IMOVEL_SELECT)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as ImovelRow[]) ?? []
}

function slugify(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const short = id.replace(/-/g, '').slice(0, 8)
  return `${base || 'imovel'}-${short}`
}

export async function createImovel(
  row: Omit<ImovelInsert, 'empresa_id'> & { empresa_id?: string },
): Promise<ImovelRow> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const { data: u } = await supabase
    .from('usuarios')
    .select('empresa_id, role')
    .eq('id', user.id)
    .single()
  if (!u?.empresa_id) throw new Error('Perfil de usuário não encontrado.')

  const empresa_id = row.empresa_id ?? u.empresa_id
  const idSeed =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now())
  const slug = slugify(row.titulo, idSeed)

  const payload = {
    ...row,
    empresa_id,
    corretor_id: row.corretor_id ?? (u.role === 'captador' ? null : user.id),
    captador_id: row.captador_id ?? (u.role === 'captador' ? user.id : null),
    slug,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('imoveis')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ImovelRow
}

export async function updateImovel(
  id: string,
  patch: ImovelUpdate,
): Promise<ImovelRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('imoveis')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error(
      'Imóvel não encontrado ou sem permissão para atualizar. Aplique a migration 004_single_tenant_admin_writes.sql no Supabase.',
    )
  }
  return data as ImovelRow
}

export async function deleteImovel(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('imoveis').delete().eq('id', id)
  if (error) throw error
}

export async function replaceImovelImagens(
  imovelId: string,
  images: { url: string; public_id: string; is_capa: boolean; ordem: number }[],
): Promise<void> {
  const supabase = createClient()
  const { error: delErr } = await supabase
    .from('imovel_imagens')
    .delete()
    .eq('imovel_id', imovelId)
  if (delErr) throw delErr

  if (!images.length) return

  const rows = images
    .map((img) => ({
      imovel_id: imovelId,
      url: img.url.trim(),
      public_id: img.public_id.trim(),
      is_capa: img.is_capa,
      ordem: img.ordem,
    }))
    .filter((img) => img.url)

  if (!rows.length) return

  const { error: insErr } = await supabase.from('imovel_imagens').insert(rows)
  if (insErr) throw insErr
}

