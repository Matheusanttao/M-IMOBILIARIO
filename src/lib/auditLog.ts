import { createClient } from '@/lib/supabase/client'

export type AuditPayload = {
  acao: string
  entidade?: string | null
  entidade_id?: string | null
  detalhes?: Record<string, unknown>
  dados_anteriores?: Record<string, unknown> | null
  dados_novos?: Record<string, unknown> | null
}

/** Registra auditoria no cliente (RLS: insert liberado com check true em logs). */
export async function auditLogClient(
  empresaId: string,
  payload: AuditPayload,
  meta?: { ip?: string; user_agent?: string },
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase.from('logs').insert({
    empresa_id: empresaId,
    usuario_id: user?.id ?? null,
    acao: payload.acao,
    entidade: payload.entidade ?? null,
    entidade_id: payload.entidade_id ?? null,
    detalhes: payload.detalhes ?? {},
    dados_anteriores: payload.dados_anteriores ?? null,
    dados_novos: payload.dados_novos ?? null,
    ip: meta?.ip ?? null,
    user_agent: meta?.user_agent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : null),
  })
  if (error) console.warn('[auditLog]', error.message)
}
