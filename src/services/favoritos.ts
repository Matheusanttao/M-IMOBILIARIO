import { createClient } from '@/lib/supabase/client'
import type { ImovelRow } from '@/types'

const STORAGE_KEY = 'mimob_fav_ids'

function canUseStorage() {
  return typeof window !== 'undefined'
}

export function readStoredFavoriteIds(): string[] {
  if (!canUseStorage()) return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function writeStoredFavoriteIds(ids: string[]) {
  if (!canUseStorage()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))))
}

export function addLocalFavorite(imovelId: string) {
  writeStoredFavoriteIds([...readStoredFavoriteIds(), imovelId])
}

export async function addFavorite(imovelId: string): Promise<'database' | 'local'> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id

  if (!userId) {
    addLocalFavorite(imovelId)
    return 'local'
  }

  const { error } = await supabase
    .from('favoritos')
    .upsert(
      { imovel_id: imovelId, usuario_id: userId },
      { onConflict: 'imovel_id,usuario_id' },
    )

  if (error) {
    addLocalFavorite(imovelId)
    return 'local'
  }

  return 'database'
}

export async function fetchFavoriteProperties(empresaId: string): Promise<{
  items: ImovelRow[]
  source: 'database' | 'local'
}> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id

  if (userId) {
    const storedIds = readStoredFavoriteIds()
    if (storedIds.length) {
      await supabase.from('favoritos').upsert(
        storedIds.map((imovelId) => ({ imovel_id: imovelId, usuario_id: userId })),
        { onConflict: 'imovel_id,usuario_id' },
      )
    }

    const { data, error } = await supabase
      .from('favoritos')
      .select('imoveis(*, imovel_imagens(*))')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })

    if (!error) {
      const items = (data ?? [])
        .map((row) => row.imoveis as unknown as ImovelRow | null)
        .filter((imovel): imovel is ImovelRow => Boolean(imovel && imovel.empresa_id === empresaId))
      return { items, source: 'database' }
    }
  }

  const ids = readStoredFavoriteIds()
  if (!ids.length) return { items: [], source: 'local' }

  const { data } = await supabase
    .from('imoveis')
    .select('*, imovel_imagens(*)')
    .eq('empresa_id', empresaId)
    .in('id', ids)

  return { items: (data as ImovelRow[]) ?? [], source: 'local' }
}
