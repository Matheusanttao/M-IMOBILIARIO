import { Link } from 'react-router-dom'
import { useLeads } from '@/hooks/useLeads'
import { formatDatePt } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'

export function LeadsList() {
  const { leads, loading, error, reload } = useLeads()

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Leads</h1>
          <p className="mt-1 text-muted">Mensagens enviadas pelos interessados.</p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="text-sm font-medium text-primary underline hover:text-accent"
        >
          Atualizar
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <p className="p-6 text-red-700">{error}</p>
        ) : !leads.length ? (
          <p className="p-8 text-center text-muted">Nenhum lead recebido ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <li key={lead.id} className="p-6 hover:bg-surface/50">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-primary">{lead.name}</p>
                    <p className="text-sm text-muted">
                      {lead.phone}
                      {lead.email ? ` · ${lead.email}` : ''}
                    </p>
                    {lead.properties ? (
                      <Link
                        to={`/imoveis/${lead.properties.id}`}
                        className="mt-1 inline-block text-sm font-medium text-accent hover:underline"
                      >
                        {lead.properties.title}
                      </Link>
                    ) : null}
                  </div>
                  <time className="text-xs text-muted">{formatDatePt(lead.created_at)}</time>
                </div>
                {lead.message ? (
                  <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-sm text-slate-700">
                    {lead.message}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
