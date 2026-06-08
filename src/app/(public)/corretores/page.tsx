import type { Metadata } from 'next'
import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'
import { getPublicEmpresa } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Corretores',
}

export default async function CorretoresPage() {
  let corretores: {
    nome: string
    email: string
    telefone: string | null
    creci: string | null
    avatar_url: string | null
  }[] = []

  if (isServerSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient()
    const emp = await getPublicEmpresa()

    const { data } = await supabase
      .from('usuarios')
      .select('nome, email, telefone, creci, avatar_url')
      .eq('empresa_id', emp?.id ?? '')
      .in('role', ['corretor', 'gerente', 'admin'])
      .eq('ativo', true)

    corretores = data ?? []
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        Especialistas
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">Nossa equipe</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(corretores ?? []).map((c) => (
          <div
            key={c.email}
            className="rounded-2xl border border-white/10 bg-card p-6 shadow-xl shadow-black/20"
          >
            <p className="font-display text-lg font-semibold text-white">{c.nome}</p>
            {c.creci ? (
              <p className="mt-1 text-sm text-white/55">CRECI {c.creci}</p>
            ) : null}
            <p className="mt-2 text-sm text-white/60">{c.email}</p>
            {c.telefone ? <p className="text-sm text-white/60">{c.telefone}</p> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
