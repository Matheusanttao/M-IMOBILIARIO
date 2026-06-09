'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import { formatCurrencyBRL } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const COLORS = [
  '#1a365d',
  '#d4a853',
  '#0f766e',
  '#7c3aed',
  '#be123c',
  '#64748b',
  '#0ea5e9',
  '#ea580c',
]

type LeadExport = {
  name: string
  phone: string | null
  email: string | null
  status: string
  origem: string | null
  created_at: string
}

type ImovelReport = {
  titulo: string
  tipo: string
  status: string
  bairro: string | null
  cidade: string | null
  preco: number | null
  created_at: string
}

type ContratoReport = {
  tipo: string
  status: string
  valor: number | null
  created_at: string
}

type ChartDatum = {
  name: string
  value: number
}

function countBy<T>(rows: T[], getter: (row: T) => string | null | undefined): ChartDatum[] {
  const count = new Map<string, number>()
  for (const row of rows) {
    const key = getter(row)?.trim() || 'Não informado'
    count.set(key, (count.get(key) ?? 0) + 1)
  }
  return [...count.entries()].map(([name, value]) => ({ name, value }))
}

function topCountBy<T>(
  rows: T[],
  getter: (row: T) => string | null | undefined,
  limit = 8,
): ChartDatum[] {
  return countBy(rows, getter)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

function monthKey(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function contractsByMonth(rows: ContratoReport[]): ChartDatum[] {
  const count = new Map<string, number>()
  for (const row of rows) {
    const key = monthKey(row.created_at)
    count.set(key, (count.get(key) ?? 0) + 1)
  }
  return [...count.entries()].map(([name, value]) => ({ name, value }))
}

export default function AdminRelatoriosPage() {
  const [leads, setLeads] = useState<LeadExport[]>([])
  const [imoveis, setImoveis] = useState<ImovelReport[]>([])
  const [contratos, setContratos] = useState<ContratoReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      const supabase = createClient()
      const [leadsResult, imoveisResult, contratosResult] = await Promise.all([
        supabase.from('leads').select('name,phone,email,status,origem,created_at'),
        supabase.from('imoveis').select('titulo,tipo,status,bairro,cidade,preco,created_at'),
        supabase.from('contratos').select('tipo,status,valor,created_at'),
      ])

      if (cancelled) return
      setLeads((leadsResult.data as LeadExport[]) ?? [])
      setImoveis((imoveisResult.data as ImovelReport[]) ?? [])
      setContratos((contratosResult.data as ContratoReport[]) ?? [])
      setLoading(false)
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

  const leadStatus = useMemo(() => countBy(leads, (row) => row.status), [leads])
  const leadsPorOrigem = useMemo(() => countBy(leads, (row) => row.origem), [leads])
  const imoveisPorStatus = useMemo(() => countBy(imoveis, (row) => row.status), [imoveis])
  const imoveisPorTipo = useMemo(() => countBy(imoveis, (row) => row.tipo), [imoveis])
  const imoveisPorBairro = useMemo(() => topCountBy(imoveis, (row) => row.bairro), [imoveis])
  const contratosPorMes = useMemo(() => contractsByMonth(contratos), [contratos])
  const contratosPorStatus = useMemo(() => countBy(contratos, (row) => row.status), [contratos])

  const valorCarteira = useMemo(
    () => imoveis.reduce((sum, imovel) => sum + Number(imovel.preco ?? 0), 0),
    [imoveis],
  )
  const valorContratos = useMemo(
    () => contratos.reduce((sum, contrato) => sum + Number(contrato.valor ?? 0), 0),
    [contratos],
  )

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
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leads), 'Leads')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(imoveis), 'Imóveis')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contratos), 'Contratos')
    XLSX.writeFile(wb, 'relatorios.xlsx')
  }

  const kpis = [
    { label: 'Leads', value: leads.length },
    { label: 'Imóveis', value: imoveis.length },
    { label: 'Contratos', value: contratos.length },
    { label: 'Carteira', value: formatCurrencyBRL(valorCarteira) },
    { label: 'Valor em contratos', value: formatCurrencyBRL(valorContratos) },
  ]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">Relatórios e BI</h1>
        <p className="mt-2 text-muted">
          Funil de leads, estoque de imóveis, contratos por mês e exportações.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
            <p className="text-sm text-muted">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-primary">{kpi.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-muted">Carregando relatórios...</p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ReportBarChart title="Funil — status dos leads" data={leadStatus} />
            <ReportPieChart title="Leads por origem" data={leadsPorOrigem} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ReportPieChart title="Imóveis por status" data={imoveisPorStatus} />
            <ReportPieChart title="Imóveis por tipo" data={imoveisPorTipo} />
            <ReportBarChart title="Top bairros" data={imoveisPorBairro} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ReportBarChart title="Contratos por mês" data={contratosPorMes} />
            <ReportPieChart title="Contratos por status" data={contratosPorStatus} />
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={downloadCsv} disabled={!csv}>
          Baixar leads.csv
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={downloadXlsx}
          disabled={!leads.length && !imoveis.length && !contratos.length}
        >
          Baixar relatorios.xlsx
        </Button>
      </div>
    </div>
  )
}

function ReportBarChart({ title, data }: { title: string; data: ChartDatum[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
      <h2 className="mb-2 font-semibold text-primary">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} interval={0} angle={-25} textAnchor="end" height={70} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" name="Quantidade">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ReportPieChart({ title, data }: { title: string; data: ChartDatum[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
      <h2 className="mb-2 font-semibold text-primary">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
