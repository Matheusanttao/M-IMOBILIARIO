import { createClient } from '@/lib/supabase/client'
import type { LeadRow } from '@/types'
import { autoDistribuirLead } from '@/services/crm'

const LEAD_STATUS_LABELS: Record<LeadRow['status'], string> = {
  novo: 'Novo',
  contato: 'Contato',
  visita: 'Visita',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  contrato: 'Contrato',
  convertido: 'Convertido',
  perdido: 'Perdido',
}

async function scoreLead(input: {
  leadId: string
  nome: string
  mensagem: string
  origem: string
}) {
  if (typeof window === 'undefined') return

  const response = await fetch('/api/ai/lead-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: input.nome,
      mensagem: input.mensagem,
      origem: input.origem,
    }),
  })
  const body = (await response.json().catch(() => ({}))) as { score?: number }
  const score =
    typeof body.score === 'number' ? Math.max(0, Math.min(100, Math.round(body.score))) : null
  if (score === null) return

  const supabase = createClient()
  await supabase.from('leads').update({ score }).eq('id', input.leadId)
}

export async function createLead(input: {
  imovel_id: string
  empresa_id: string
  name: string
  phone: string
  email?: string
  message: string
}): Promise<void> {
  const supabase = createClient()
  const origem = 'site'
  const { data, error } = await supabase
    .from('leads')
    .insert({
      imovel_id: input.imovel_id,
      empresa_id: input.empresa_id,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      message: input.message,
      origem,
      status: 'novo',
    })
    .select('id, empresa_id')
    .single()
  if (error) throw error

  await Promise.allSettled([
    scoreLead({
      leadId: data.id,
      nome: input.name,
      mensagem: input.message,
      origem,
    }),
    autoDistribuirLead(data.id, data.empresa_id),
  ])
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
  const { data: current, error: currentError } = await supabase
    .from('leads')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (currentError) throw currentError
  if (!current) throw new Error('Lead não encontrado.')
  if (current.status === status) return

  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) throw error

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const from = LEAD_STATUS_LABELS[current.status as LeadRow['status']] ?? current.status
  const to = LEAD_STATUS_LABELS[status] ?? status
  const { error: historyError } = await supabase.from('lead_historico').insert({
    lead_id: id,
    usuario_id: user?.id ?? null,
    tipo: 'sistema',
    conteudo: `Status alterado de ${from} para ${to}.`,
  })

  if (historyError) throw historyError
}
