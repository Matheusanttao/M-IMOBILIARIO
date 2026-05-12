'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLeads } from '@/hooks/useLeads'
import { updateLeadStatus } from '@/services/leads'
import type { LeadStatus } from '@/types'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatDatePt } from '@/lib/utils'

const columns: { id: LeadStatus; title: string }[] = [
  { id: 'novo', title: 'Novo' },
  { id: 'contatado', title: 'Contatado' },
  { id: 'qualificado', title: 'Qualificado' },
  { id: 'negociacao', title: 'Negociação' },
  { id: 'convertido', title: 'Convertido' },
  { id: 'perdido', title: 'Perdido' },
]

export function LeadsKanban() {
  const { leads, loading, error, reload } = useLeads()
  const [busy, setBusy] = useState<string | null>(null)

  const byColumn = useMemo(() => {
    const map = new Map<LeadStatus, typeof leads>()
    for (const c of columns) map.set(c.id, [])
    for (const l of leads) {
      const col = map.get(l.status) ?? map.get('novo')!
      col.push(l)
    }
    return map
  }, [leads])

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
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-[1100px] gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="w-64 shrink-0 rounded-2xl border border-slate-100 bg-white shadow-md"
          >
            <div className="border-b border-slate-100 px-3 py-2 font-semibold text-primary">
              {col.title}
            </div>
            <div className="space-y-2 p-2">
              {(byColumn.get(col.id) ?? []).map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl border border-slate-100 bg-surface/80 p-3 text-sm"
                >
                  <p className="font-medium text-slate-800">{l.name}</p>
                  <p className="text-xs text-muted">{formatDatePt(l.created_at)}</p>
                  {l.imoveis?.titulo ? (
                    <p className="mt-1 text-xs text-primary">
                      <Link
                        href={`/imoveis/${l.imoveis.slug ?? l.imoveis.id}`}
                        className="underline"
                      >
                        {l.imoveis.titulo}
                      </Link>
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {columns
                      .filter((c) => c.id !== l.status)
                      .map((c) => (
                        <Button
                          key={c.id}
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-xs"
                          disabled={busy === l.id}
                          onClick={() => move(l.id, c.id)}
                        >
                          → {c.title}
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
