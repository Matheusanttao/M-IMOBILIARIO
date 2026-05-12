import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function MasterPlanosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: planos } = await supabase.from('planos').select('*').order('preco_mensal')

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Planos</h1>
      <ul className="mt-8 space-y-4">
        {(planos ?? []).map((p) => (
          <li
            key={p.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold text-primary">{p.nome}</p>
            <p className="text-sm text-muted">
              R$ {Number(p.preco_mensal).toFixed(2)} / mês — slug: {p.slug}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
