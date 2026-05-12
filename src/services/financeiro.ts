import { createClient } from '@/lib/supabase/client'
import type { FinanceiroLancamentoRow } from '@/types'

export async function fetchLancamentos(params?: {
  status?: string
  tipo?: 'receita' | 'despesa'
  from?: string
  to?: string
}) {
  const supabase = createClient()
  let q = supabase
    .from('financeiro_lancamentos')
    .select('*')
    .order('data_vencimento', { ascending: true })
  if (params?.status) q = q.eq('status', params.status)
  if (params?.tipo) q = q.eq('tipo', params.tipo)
  if (params?.from) q = q.gte('data_vencimento', params.from)
  if (params?.to) q = q.lte('data_vencimento', params.to)
  const { data, error } = await q
  if (error) throw error
  return (data as FinanceiroLancamentoRow[]) ?? []
}

export async function saveLancamento(
  row: Omit<FinanceiroLancamentoRow, 'id' | 'created_at' | 'updated_at'> & { id?: string },
) {
  const supabase = createClient()
  const now = new Date().toISOString()
  if (row.id) {
    const { error } = await supabase
      .from('financeiro_lancamentos')
      .update({ ...row, updated_at: now })
      .eq('id', row.id)
    if (error) throw error
    return row.id
  }
  const { data, error } = await supabase
    .from('financeiro_lancamentos')
    .insert({ ...row, updated_at: now })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

export async function fetchCategorias() {
  const supabase = createClient()
  const { data, error } = await supabase.from('financeiro_categorias').select('*').order('nome')
  if (error) throw error
  return data ?? []
}
