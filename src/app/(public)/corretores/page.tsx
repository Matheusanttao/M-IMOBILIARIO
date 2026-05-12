import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Corretores',
}

export default async function CorretoresPage() {
  const supabase = await createServerSupabaseClient()
  const cookieStore = await cookies()
  const tenant = cookieStore.get('tenant_slug')?.value ?? 'demo'
  const { data: emp } = await supabase
    .from('empresas')
    .select('id')
    .eq('slug', tenant)
    .maybeSingle()

  const { data: corretores } = await supabase
    .from('usuarios')
    .select('nome, email, telefone, creci, avatar_url')
    .eq('empresa_id', emp?.id ?? '')
    .in('role', ['corretor', 'gerente', 'admin'])
    .eq('ativo', true)

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-primary">Nossa equipe</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(corretores ?? []).map((c) => (
          <div
            key={c.email}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md"
          >
            <p className="font-display text-lg font-semibold text-primary">{c.nome}</p>
            {c.creci ? (
              <p className="mt-1 text-sm text-muted">CRECI {c.creci}</p>
            ) : null}
            <p className="mt-2 text-sm text-slate-600">{c.email}</p>
            {c.telefone ? <p className="text-sm text-slate-600">{c.telefone}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
