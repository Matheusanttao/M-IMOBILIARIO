'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrencyBRL, formatDatePt } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'

interface Pagamento {
  id: string
  empresa_id: string
  valor: number
  status: string
  metodo: string | null
  data_pagamento: string | null
  created_at: string
  empresa_nome: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'estornado', label: 'Estornado' },
]

const STATUS_BADGE: Record<string, { variant: 'success' | 'accent' | 'default' | 'muted'; label: string }> = {
  aprovado: { variant: 'success', label: 'Aprovado' },
  pendente: { variant: 'accent', label: 'Pendente' },
  recusado: { variant: 'muted', label: 'Recusado' },
  estornado: { variant: 'default', label: 'Estornado' },
}

export default function MasterPagamentosPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadPagamentos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('pagamentos')
      .select('id, empresa_id, valor, status, metodo, data_pagamento, created_at, empresas(nome)')
      .order('created_at', { ascending: false })

    const mapped = (data ?? []).map((r) => ({
      id: r.id,
      empresa_id: r.empresa_id,
      valor: Number(r.valor),
      status: r.status,
      metodo: r.metodo,
      data_pagamento: r.data_pagamento,
      created_at: r.created_at,
      empresa_nome: (r.empresas as unknown as { nome: string })?.nome ?? '—',
    }))
    setPagamentos(mapped)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadPagamentos()
  }, [loadPagamentos])

  const filtered = pagamentos.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false
    if (dateFrom && p.created_at < dateFrom) return false
    if (dateTo) {
      const end = dateTo + 'T23:59:59'
      if (p.created_at > end) return false
    }
    return true
  })

  const totalAprovado = filtered
    .filter((p) => p.status === 'aprovado')
    .reduce((s, p) => s + p.valor, 0)
  const totalPendente = filtered
    .filter((p) => p.status === 'pendente')
    .reduce((s, p) => s + p.valor, 0)
  const totalRecusado = filtered
    .filter((p) => p.status === 'recusado')
    .reduce((s, p) => s + p.valor, 0)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">Pagamentos</h1>
        <p className="mt-1 text-muted">
          Integração Mercado Pago via Edge Function — webhook em{' '}
          <code className="rounded bg-slate-200 px-1 text-xs">/api/webhooks/mercadopago</code>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <p className="text-sm font-medium text-muted">Recebidos</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-600">
            {formatCurrencyBRL(totalAprovado)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <p className="text-sm font-medium text-muted">Pendentes</p>
          <p className="mt-2 font-display text-2xl font-bold text-amber-600">
            {formatCurrencyBRL(totalPendente)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <p className="text-sm font-medium text-muted">Recusados</p>
          <p className="mt-2 font-display text-2xl font-bold text-red-600">
            {formatCurrencyBRL(totalRecusado)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Status"
          />
        </div>
        <div className="w-44">
          <Input
            type="date"
            label="De"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Input
            type="date"
            label="Até"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Data pagamento</th>
              <th className="px-4 py-3">Criado em</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Nenhum pagamento encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const badge = STATUS_BADGE[p.status] ?? { variant: 'muted' as const, label: p.status }
                return (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.empresa_nome}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrencyBRL(p.valor)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.metodo ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.data_pagamento ? formatDatePt(p.data_pagamento) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDatePt(p.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
