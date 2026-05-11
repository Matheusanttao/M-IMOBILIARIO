import { getSupabase } from '@/services/supabase'
import type { LeadRow } from '@/types'

export async function createLead(input: {
  property_id: string
  name: string
  phone: string
  email?: string
  message: string
}): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('leads').insert({
    property_id: input.property_id,
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    message: input.message,
  })
  if (error) throw error
}

export async function fetchLeadsForUser(): Promise<
  (LeadRow & { properties?: { title: string; id: string } | null })[]
> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('leads')
    .select('*, properties ( id, title )')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (
    (data as (LeadRow & { properties?: { title: string; id: string } | null })[]) ??
    []
  )
}

export async function countLeadsForUser(): Promise<number> {
  const supabase = getSupabase()
  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}
