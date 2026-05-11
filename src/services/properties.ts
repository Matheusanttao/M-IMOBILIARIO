import { getSupabase } from '@/services/supabase'
import type {
  PropertyImageRow,
  PropertyInsert,
  PropertyListFilters,
  PropertyRow,
  PropertySort,
  PropertyUpdate,
} from '@/types'
import { PAGE_SIZE } from '@/lib/constants'

export { PAGE_SIZE } from '@/lib/constants'

const PROPERTY_SELECT = `
  *,
  property_images (*)
`

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: PropertyListFilters,
) {
  let q = query
  if (filters.purpose) q = q.eq('purpose', filters.purpose)
  if (filters.city?.trim()) q = q.ilike('city', `%${filters.city.trim()}%`)
  if (filters.neighborhood?.trim()) {
    q = q.ilike('neighborhood', `%${filters.neighborhood.trim()}%`)
  }
  if (filters.type) q = q.eq('type', filters.type)
  if (filters.priceMin != null && !Number.isNaN(filters.priceMin)) {
    q = q.gte('price', filters.priceMin)
  }
  if (filters.priceMax != null && !Number.isNaN(filters.priceMax)) {
    q = q.lte('price', filters.priceMax)
  }
  if (filters.bedrooms != null && filters.bedrooms > 0) {
    q = q.gte('bedrooms', filters.bedrooms)
  }
  if (filters.bathrooms != null && filters.bathrooms > 0) {
    q = q.gte('bathrooms', filters.bathrooms)
  }
  if (filters.parking_spaces != null && filters.parking_spaces > 0) {
    q = q.gte('parking_spaces', filters.parking_spaces)
  }
  return q
}

function applySort(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  sort: PropertySort,
) {
  if (sort === 'price_asc') return query.order('price', { ascending: true })
  if (sort === 'price_desc') return query.order('price', { ascending: false })
  return query.order('created_at', { ascending: false })
}

export async function fetchPublicProperties(params: {
  filters: PropertyListFilters
  sort: PropertySort
  page: number
}): Promise<{ data: PropertyRow[]; count: number | null }> {
  const supabase = getSupabase()
  const from = (params.page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('properties')
    .select(PROPERTY_SELECT, { count: 'exact' })
    .eq('status', 'ativo')

  query = applyFilters(query, params.filters)
  query = applySort(query, params.sort)
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { data: (data as PropertyRow[]) ?? [], count }
}

export async function fetchFeaturedProperties(
  limit = 6,
): Promise<PropertyRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('status', 'ativo')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as PropertyRow[]) ?? []
}

export async function fetchPropertyById(
  id: string,
  options?: { includeInactive?: boolean },
): Promise<PropertyRow | null> {
  const supabase = getSupabase()
  let query = supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('id', id)

  if (!options?.includeInactive) {
    query = query.eq('status', 'ativo')
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data as PropertyRow | null
}

/** Detalhe para edição no admin (inclui inativos se o usuário for dono — RLS restringe) */
export async function fetchPropertyForAdmin(id: string): Promise<PropertyRow | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as PropertyRow | null
}

export async function fetchMyProperties(): Promise<PropertyRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_SELECT)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data as PropertyRow[]) ?? []
}

export async function createProperty(
  row: Omit<PropertyInsert, 'user_id'> & { user_id?: string },
): Promise<PropertyRow> {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado.')

  const payload = {
    ...row,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as PropertyRow
}

export async function updateProperty(
  id: string,
  patch: PropertyUpdate,
): Promise<PropertyRow> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('properties')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PropertyRow
}

export async function deleteProperty(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
}

export async function replacePropertyImages(
  propertyId: string,
  images: { image_url: string; public_id: string; is_cover: boolean }[],
): Promise<void> {
  const supabase = getSupabase()
  const { error: delErr } = await supabase
    .from('property_images')
    .delete()
    .eq('property_id', propertyId)
  if (delErr) throw delErr

  if (!images.length) return

  const rows = images.map((img) => ({
    property_id: propertyId,
    image_url: img.image_url,
    public_id: img.public_id,
    is_cover: img.is_cover,
  }))

  const { error: insErr } = await supabase.from('property_images').insert(rows)
  if (insErr) throw insErr
}

export async function appendPropertyImages(
  propertyId: string,
  images: { image_url: string; public_id: string; is_cover: boolean }[],
): Promise<PropertyImageRow[]> {
  if (!images.length) return []
  const supabase = getSupabase()
  const rows = images.map((img) => ({
    property_id: propertyId,
    image_url: img.image_url,
    public_id: img.public_id,
    is_cover: img.is_cover,
  }))
  const { data, error } = await supabase
    .from('property_images')
    .insert(rows)
    .select()

  if (error) throw error
  return (data as PropertyImageRow[]) ?? []
}

export async function deletePropertyImageRow(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('property_images').delete().eq('id', id)
  if (error) throw error
}
