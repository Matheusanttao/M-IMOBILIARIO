import { createClient } from '@/lib/supabase/client'

export async function fetchPropostas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('propostas')
    .select('*, imoveis ( titulo, slug )')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchContratos() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contratos')
    .select('*, imoveis ( titulo, slug )')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createContrato(input: Record<string, unknown>): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contratos')
    .insert(input)
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

export async function createProposta(
  input: Record<string, unknown>,
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.from('propostas').insert(input).select('id').single()
  if (error) throw error
  return data!.id as string
}
