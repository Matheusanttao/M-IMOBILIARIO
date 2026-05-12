import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function AdminConfigPage() {
  const supabase = await createServerSupabaseClient()
  const { data: emp } = await supabase.from('empresas').select('*').maybeSingle()

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Configurações</h1>
      <p className="mt-2 text-muted">Dados da empresa (somente leitura nesta versão inicial).</p>
      <pre className="mt-8 overflow-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">
        {JSON.stringify(emp, null, 2)}
      </pre>
    </div>
  )
}
