import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function AdminEquipePage() {
  const supabase = await createServerSupabaseClient()
  const { data: rows } = await supabase
    .from('usuarios')
    .select('nome,email,role,creci,ativo')
    .order('nome')

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Equipe</h1>
      <p className="mt-2 text-muted">Corretores e permissões do tenant.</p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-surface/80 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">CRECI</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rows ?? []).map((u) => (
              <tr key={u.email}>
                <td className="px-4 py-3">{u.nome}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.creci ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
