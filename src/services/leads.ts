import { createClient } from '@/lib/supabase/client'
import type { LeadRow } from '@/types'

export async function createLead(input: {
  imovel_id: string
  empresa_id: string
  name: string
  phone: string
  email?: string
  message: string
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('leads').insert({
    imovel_id: input.imovel_id,
    empresa_id: input.empresa_id,
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    message: input.message,
    origem: 'site',
    status: 'novo',
  })
  if (error) throw error
}

export async function fetchLeadsForTenant(): Promise<
  (LeadRow & {
    imoveis?: { titulo: string; id: string; slug: string | null } | null
  })[]
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, imoveis ( id, titulo, slug )')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (
    (data as (LeadRow & {
      imoveis?: { titulo: string; id: string; slug: string | null } | null
    })[]) ?? []
  )
}
export async function countLeadsForTenant(): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

export async function updateLeadStatus(
  id: string,
  status: LeadRow['status'],
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw error
}
