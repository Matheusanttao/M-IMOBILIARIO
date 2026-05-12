import { createClient } from '@/lib/supabase/client'
import type { LeadRow } from '@/types'

export async function fetchLeadById(id: string): Promise<
  | (LeadRow & {
      imoveis?: { titulo: string; id: string; slug: string | null } | null
    })
  | null
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, imoveis ( id, titulo, slug )')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as LeadRow & {
    imoveis?: { titulo: string; id: string; slug: string | null } | null
  }
}

export async function fetchLeadHistorico(leadId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lead_historico')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchLeadComentarios(leadId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lead_comentarios')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addLeadComentario(input: {
  empresa_id: string
  lead_id: string
  usuario_id: string
  conteudo: string
}) {
  const supabase = createClient()
  const { error } = await supabase.from('lead_comentarios').insert(input)
  if (error) throw error
}

export async function fetchLeadTarefas(leadId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lead_tarefas')
    .select('*')
    .eq('lead_id', leadId)
    .order('prazo', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addLeadTarefa(input: {
  empresa_id: string
  lead_id: string
  usuario_id: string | null
  titulo: string
  descricao?: string | null
  prazo?: string | null
}) {
  const supabase = createClient()
  const { error } = await supabase.from('lead_tarefas').insert(input)
  if (error) throw error
}

export async function toggleLeadTarefa(id: string, concluida: boolean) {
  const supabase = createClient()
  const { error } = await supabase.from('lead_tarefas').update({ concluida }).eq('id', id)
  if (error) throw error
}

/** Distribuição automática: round-robin entre corretores ativos da empresa. */
export async function autoDistribuirLead(leadId: string, empresaId: string): Promise<void> {
  const supabase = createClient()
  const { data: corretores, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .in('role', ['corretor', 'gerente'])
    .order('created_at', { ascending: true })
  if (error || !corretores?.length) return

  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)

  const idx = (count ?? 0) % corretores.length
  const assignado = corretores[idx]!.id as string
  await supabase.from('leads').update({ assignado_para: assignado }).eq('id', leadId)
}
