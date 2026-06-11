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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuário não autenticado.')

  const { data: perfil, error: perfilError } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .maybeSingle()

  if (perfilError) throw perfilError

  const empresaId =
    typeof perfil?.empresa_id === 'string'
      ? perfil.empresa_id
      : typeof input.empresa_id === 'string'
        ? input.empresa_id
        : ''

  if (!empresaId) {
    throw new Error('Empresa do usuário não encontrada para cadastrar o contrato.')
  }

  const { data, error } = await supabase
    .from('contratos')
    .insert({
      ...input,
      empresa_id: empresaId,
    })
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
