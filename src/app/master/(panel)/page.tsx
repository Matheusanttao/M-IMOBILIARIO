import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function MasterDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { count: empresas } = await supabase
    .from('empresas')
    .select('*', { count: 'exact', head: true })
  const { count: assinaturas } = await supabase
    .from('assinaturas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativa')

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Painel Master</h1>
      <p className="mt-2 text-muted">Visão global do SaaS.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <p className="text-sm text-muted">Empresas</p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {empresas ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <p className="text-sm text-muted">Assinaturas ativas</p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {assinaturas ?? 0}
          </p>
        </div>
      </div>
    </div>
  )
}
