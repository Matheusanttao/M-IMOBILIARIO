import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function MasterEmpresasPage() {
  const supabase = await createServerSupabaseClient()
  const { data: rows } = await supabase
    .from('empresas')
    .select('id,nome,slug,ativa,email,created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Imobiliárias</h1>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Ativa</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rows ?? []).map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium">{e.nome}</td>
                <td className="px-4 py-3">{e.slug}</td>
                <td className="px-4 py-3">{e.email ?? '—'}</td>
                <td className="px-4 py-3">{e.ativa ? 'sim' : 'não'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
