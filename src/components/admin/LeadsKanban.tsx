'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { updateLeadStatus } from '@/services/leads'
import type { LeadStatus } from '@/types'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDatePt } from '@/lib/utils'

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'contato', label: 'Contato' },
  { value: 'visita', label: 'Visita' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'perdido', label: 'Perdido' },
]

const statusLabels = Object.fromEntries(
  statusOptions.map((item) => [item.value, item.label]),
) as Record<LeadStatus, string>

export function LeadsKanban() {
  const { leads, loading, error, reload } = useLeads()
  const [busy, setBusy] = useState<string | null>(null)

  const move = useCallback(
    async (id: string, status: LeadStatus) => {
      setBusy(id)
      try {
        await updateLeadStatus(id, status)
        reload()
      } finally {
        setBusy(null)
      }
    },
    [reload],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-700">{error}</p>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">
          {leads.length} lead(s) encontrado(s)
        </p>
      </div>
      {leads.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Imóvel</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recebido em</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((lead) => (
                <tr key={lead.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{lead.name}</p>
                    {lead.message ? (
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                        {lead.message}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{lead.phone || '-'}</p>
                    {lead.email ? (
                      <p className="mt-0.5 text-xs text-slate-400">{lead.email}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {lead.imoveis?.titulo ? (
                      <Link
                        href={`/imoveis/${lead.imoveis.slug ?? lead.imoveis.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {lead.imoveis.titulo}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Sem imóvel</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {lead.origem || 'site'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      aria-label={`Status de ${lead.name}`}
                      value={lead.status}
                      options={statusOptions}
                      disabled={busy === lead.id}
                      onChange={(event) =>
                        void move(lead.id, event.target.value as LeadStatus)
                      }
                      className="min-w-44 py-1.5 text-xs"
                    />
                    <span className="sr-only">{statusLabels[lead.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDatePt(lead.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-muted">
          Nenhum lead recebido ainda.
        </div>
      )}
    </div>
  )
}
