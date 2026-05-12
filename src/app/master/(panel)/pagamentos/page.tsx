import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function MasterPagamentosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: rows } = await supabase
    .from('pagamentos')
    .select('id,valor,status,created_at,empresa_id')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Pagamentos</h1>
      <p className="mt-2 text-muted">
        Integração Mercado Pago via Edge Function — webhook em{' '}
        <code className="rounded bg-slate-200 px-1">/api/webhooks/mercadopago</code>.
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(rows ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  Nenhum pagamento registrado.
                </td>
              </tr>
            ) : (
              (rows ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">R$ {Number(r.valor).toFixed(2)}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{r.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
