'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrencyBRL, formatDatePt } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface MonthData {
  month: string
  count: number
}

interface EmpresaRecent {
  id: string
  nome: string
  slug: string
  ativa: boolean
  created_at: string
}

interface EmpresaInadimplente {
  id: string
  nome: string
  slug: string
  email: string | null
}

export default function MasterDashboardPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [totalEmpresas, setTotalEmpresas] = useState(0)
  const [assinaturasAtivas, setAssinaturasAtivas] = useState(0)
  const [mrr, setMrr] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [monthlyEmpresas, setMonthlyEmpresas] = useState<MonthData[]>([])
  const [recentEmpresas, setRecentEmpresas] = useState<EmpresaRecent[]>([])
  const [empresasInadimplentes, setEmpresasInadimplentes] = useState<EmpresaInadimplente[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)

    const [
      { count: countEmpresas },
      { count: countAtivas },
      { data: assinaturasAtivasData },
      { data: inadimplentesData },
      { data: allEmpresas },
      { data: recent },
    ] = await Promise.all([
      supabase.from('empresas').select('*', { count: 'exact', head: true }),
      supabase.from('assinaturas').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
      supabase.from('assinaturas').select('plano_id, planos(preco_mensal)').eq('status', 'ativa'),
      supabase
        .from('assinaturas')
        .select('empresa_id, empresas(id, nome, slug, email)')
        .eq('status', 'inadimplente'),
      supabase.from('empresas').select('id, created_at').order('created_at'),
      supabase
        .from('empresas')
        .select('id, nome, slug, ativa, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    setTotalEmpresas(countEmpresas ?? 0)
    setAssinaturasAtivas(countAtivas ?? 0)

    const mrrTotal = (assinaturasAtivasData ?? []).reduce((sum, a) => {
      const plano = a.planos as unknown as { preco_mensal: number } | null
      return sum + (plano?.preco_mensal ?? 0)
    }, 0)
    setMrr(mrrTotal)

    const inadList = (inadimplentesData ?? [])
      .map((a) => a.empresas as unknown as EmpresaInadimplente)
      .filter(Boolean)
    setEmpresasInadimplentes(inadList)
    setInadimplentes(inadList.length)

    setRecentEmpresas(recent ?? [])

    const now = new Date()
    const months: MonthData[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const start = d.toISOString()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
      const count = (allEmpresas ?? []).filter(
        (e) => e.created_at >= start && e.created_at < end,
      ).length
      months.push({ month: label, count })
    }
    setMonthlyEmpresas(months)

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const kpis = [
    { label: 'Total empresas', value: totalEmpresas, color: 'text-primary' },
    { label: 'Assinaturas ativas', value: assinaturasAtivas, color: 'text-emerald-600' },
    { label: 'MRR previsto', value: formatCurrencyBRL(mrr), color: 'text-blue-600' },
    {
      label: 'Inadimplentes',
      value: inadimplentes,
      color: inadimplentes > 0 ? 'text-red-600' : 'text-primary',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">Painel Master</h1>
        <p className="mt-1 text-muted">Visão global do SaaS.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
          >
            <p className="text-sm font-medium text-muted">{kpi.label}</p>
            <p className={`mt-2 font-display text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="mb-4 font-display text-lg font-semibold text-primary">
            Empresas criadas por mês
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyEmpresas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                formatter={(v: number) => [v, 'Empresas']}
              />
              <Bar dataKey="count" fill="#1a365d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent empresas */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Empresas recentes
            </h2>
          </div>
          <div className="divide-y">
            {recentEmpresas.length === 0 ? (
              <p className="px-6 py-8 text-center text-muted">Nenhuma empresa cadastrada.</p>
            ) : (
              recentEmpresas.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{e.nome}</p>
                    <p className="text-xs text-muted">{e.slug}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        e.ativa
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      }`}
                    >
                      {e.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                    <p className="mt-1 text-xs text-muted">{formatDatePt(e.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inadimplentes */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-md">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Empresas inadimplentes
            </h2>
          </div>
          {empresasInadimplentes.length === 0 ? (
            <p className="px-6 py-8 text-center text-muted">
              Nenhuma empresa inadimplente.
            </p>
          ) : (
            <div className="divide-y">
              {empresasInadimplentes.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{e.nome}</p>
                    <p className="text-xs text-muted">{e.email ?? '—'}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Inadimplente
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
