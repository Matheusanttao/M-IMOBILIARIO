import { createClient } from '@/lib/supabase/client'
import type { ImovelProprietarioRow, ProprietarioRow } from '@/types'

export async function fetchProprietarios(params?: {
  search?: string
  ativo?: boolean | null
  page?: number
  pageSize?: number
}): Promise<{ rows: ProprietarioRow[]; total: number }> {
  const supabase = createClient()
  const page = params?.page ?? 0
  const size = params?.pageSize ?? 20
  const from = page * size
  const to = from + size - 1

  let q = supabase
    .from('proprietarios')
    .select('*', { count: 'exact' })
    .order('nome', { ascending: true })
    .range(from, to)

  if (params?.ativo === true) q = q.eq('ativo', true)
  if (params?.ativo === false) q = q.eq('ativo', false)
  if (params?.search?.trim()) {
    const t = params.search.trim()
    q = q.ilike('nome', `%${t}%`)
  }

  const { data, error, count } = await q
  if (error) throw error
  return { rows: (data as ProprietarioRow[]) ?? [], total: count ?? 0 }
}

export async function fetchProprietarioById(id: string): Promise<ProprietarioRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('proprietarios').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as ProprietarioRow) ?? null
}

export async function saveProprietario(
  input: Partial<ProprietarioRow> & { empresa_id: string; nome: string },
  id?: string | null,
): Promise<string> {
  const supabase = createClient()
  const payload = {
    ...input,
    updated_at: new Date().toISOString(),
  }
  if (id) {
    const { error } = await supabase.from('proprietarios').update(payload).eq('id', id)
    if (error) throw error
    return id
  }
  const { data, error } = await supabase.from('proprietarios').insert(payload).select('id').single()
  if (error) throw error
  return data!.id as string
}

export async function fetchImoveisDoProprietario(
  proprietarioId: string,
): Promise<ImovelProprietarioRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('imovel_proprietarios')
    .select('*')
    .eq('proprietario_id', proprietarioId)
  if (error) throw error
  return (data as ImovelProprietarioRow[]) ?? []
}

export async function fetchProprietariosDoImovel(
  imovelId: string,
): Promise<ImovelProprietarioRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('imovel_proprietarios')
    .select('*')
    .eq('imovel_id', imovelId)
    .order('principal', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as ImovelProprietarioRow[]) ?? []
}

export async function linkProprietarioImovel(row: {
  empresa_id: string
  imovel_id: string
  proprietario_id: string
  percentual: number
  principal?: boolean
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('imovel_proprietarios').upsert(
    {
      empresa_id: row.empresa_id,
      imovel_id: row.imovel_id,
      proprietario_id: row.proprietario_id,
      percentual: row.percentual,
      principal: row.principal ?? false,
    },
    { onConflict: 'imovel_id,proprietario_id' },
  )
  if (error) throw error
}

export async function replaceProprietariosImovel(
  imovelId: string,
  rows: {
    empresa_id: string
    proprietario_id: string
    percentual: number
    principal?: boolean
  }[],
): Promise<void> {
  const supabase = createClient()
  const { error: delErr } = await supabase
    .from('imovel_proprietarios')
    .delete()
    .eq('imovel_id', imovelId)
  if (delErr) throw delErr

  if (!rows.length) return

  const { error: insErr } = await supabase.from('imovel_proprietarios').insert(
    rows.map((row) => ({
      empresa_id: row.empresa_id,
      imovel_id: imovelId,
      proprietario_id: row.proprietario_id,
      percentual: row.percentual,
      principal: row.principal ?? false,
    })),
  )
  if (insErr) throw insErr
}
