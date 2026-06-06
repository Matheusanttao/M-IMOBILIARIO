'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import * as XLSX from 'xlsx'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#1a365d', '#d4a853', '#0f766e', '#7c3aed', '#be123c', '#64748b', '#0ea5e9', '#ea580c']

type LeadExport = {
  name: string
  phone: string | null
  email: string | null
  status: string
  origem: string
  created_at: string
}

export default function AdminRelatoriosPage() {
  const [leads, setLeads] = useState<LeadExport[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const supabase = createClient()
      const { data } = await supabase.from('leads').select('name,phone,email,status,origem,created_at')
      if (!cancelled && data) setLeads(data as LeadExport[])
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const csv = useMemo(() => {
    if (!leads.length) return null
    const header = 'nome,telefone,email,status,origem,criado_em'
    const lines = leads.map((r) =>
      [r.name, r.phone ?? '', r.email ?? '', r.status, r.origem ?? '', r.created_at].join(','),
    )
    return [header, ...lines].join('\n')
  }, [leads])

  const funnel = useMemo(() => {
    const statusCount = new Map<string, number>()
    for (const r of leads) {
      statusCount.set(r.status, (statusCount.get(r.status) ?? 0) + 1)
    }
    return [...statusCount.entries()].map(([name, value]) => ({ name, value }))
  }, [leads])

  const porOrigem = useMemo(() => {
    const origemCount = new Map<string, number>()
    for (const r of leads) {
      const o = r.origem || 'desconhecida'
      origemCount.set(o, (origemCount.get(o) ?? 0) + 1)
    }
    return [...origemCount.entries()].map(([name, value]) => ({ name, value }))
  }, [leads])

  function downloadCsv() {
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadXlsx() {
    if (!leads.length) return
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(
      leads.map((r) => ({
        nome: r.name,
        telefone: r.phone,
        email: r.email,
        status: r.status,
        origem: r.origem,
        criado_em: r.created_at,
      })),
    )
    XLSX.utils.book_append_sheet(wb, ws, 'Leads')
    XLSX.writeFile(wb, 'leads.xlsx')
  }

  const mrrNote = useMemo(
    () => 'Use assinaturas e status atualizados manualmente para acompanhar MRR, churn e CAC.',
    [],
  )

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">Relatórios e BI</h1>
        <p className="mt-2 text-muted">Funil de leads, origem e exportações (CSV / Excel).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
          <h2 className="mb-2 font-semibold text-primary">Funil — status dos leads</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Quantidade">
                  {funnel.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
          <h2 className="mb-2 font-semibold text-primary">Leads por origem</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porOrigem} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {porOrigem.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
        <h2 className="mb-2 font-semibold text-primary">SaaS — métricas</h2>
        <p className="text-sm text-muted">{mrrNote}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={downloadCsv} disabled={!csv}>
          Baixar leads.csv
        </Button>
        <Button type="button" variant="secondary" onClick={downloadXlsx} disabled={!leads.length}>
          Baixar leads.xlsx
        </Button>
      </div>
    </div>
  )
}
