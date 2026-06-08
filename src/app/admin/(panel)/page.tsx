'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  Building2,
  DollarSign,
  FileSignature,
  Handshake,
  UserPlus,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrencyBRL } from '@/lib/utils'
import type { ImovelStatus, LeadStatus, PropertyType } from '@/types'

type Tone = 'gold' | 'dark'
type RelatedTitle = { titulo: string } | { titulo: string }[] | null | undefined

type ImovelDashboard = {
  id: string
  titulo: string
  tipo: PropertyType
  cidade: string
  bairro: string
  status: ImovelStatus
  visualizacoes: number
  created_at: string
  imovel_imagens?: { url: string; is_capa: boolean; ordem: number }[]
}

type LeadDashboard = {
  id: string
  name: string
  status: LeadStatus
  created_at: string
  imoveis?: RelatedTitle
}

type ContratoDashboard = {
  id: string
  tipo: 'venda' | 'aluguel'
  valor: number
  status: string
  created_at: string
  imoveis?: RelatedTitle
}

type DashboardData = {
  imoveis: ImovelDashboard[]
  leads: LeadDashboard[]
  contratos: ContratoDashboard[]
}

const TYPE_LABELS: Record<PropertyType, string> = {
  apartamento: 'Apartamentos',
  casa: 'Casas',
  terreno: 'Terrenos',
  sala_comercial: 'Comerciais',
}

const TYPE_COLORS: Record<PropertyType, string> = {
  apartamento: '#d4a853',
  casa: '#1f2d3d',
  terreno: '#64748b',
  sala_comercial: '#94a3b8',
}

const FUNNEL_COLORS = ['#1f2d3d', '#3b4a5e', '#b8923f', '#d4a853']

function startOfCurrentMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isThisMonth(date: string) {
  return new Date(date) >= startOfCurrentMonth()
}

function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `Há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Há ${hours}h`
  const days = Math.floor(hours / 24)
  return `Há ${days} dia${days > 1 ? 's' : ''}`
}

function getRelatedTitle(relation: RelatedTitle) {
  if (Array.isArray(relation)) return relation[0]?.titulo ?? null
  return relation?.titulo ?? null
}

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const [data, setData] = useState<DashboardData>({
    imoveis: [],
    leads: [],
    contratos: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      const [imoveisRes, leadsRes, contratosRes] = await Promise.all([
        supabase
          .from('imoveis')
          .select('id,titulo,tipo,cidade,bairro,status,visualizacoes,created_at,imovel_imagens(url,is_capa,ordem)')
          .order('visualizacoes', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('leads')
          .select('id,name,status,created_at,imoveis(titulo)')
          .order('created_at', { ascending: false }),
        supabase
          .from('contratos')
          .select('id,tipo,valor,status,created_at,imoveis(titulo)')
          .order('created_at', { ascending: false }),
      ])

      const firstError = imoveisRes.error || leadsRes.error || contratosRes.error
      if (firstError) throw firstError

      if (!cancelled) {
        setData({
          imoveis: (imoveisRes.data as ImovelDashboard[]) ?? [],
          leads: (leadsRes.data as unknown as LeadDashboard[]) ?? [],
          contratos: (contratosRes.data as unknown as ContratoDashboard[]) ?? [],
        })
      }
    }

    loadDashboard()
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [supabase])

  const vendasMes = data.contratos
    .filter((c) => c.tipo === 'venda' && c.status !== 'cancelado' && isThisMonth(c.created_at))
    .reduce((sum, c) => sum + Number(c.valor || 0), 0)

  const leadsAtivos = data.leads.filter((l) => !['convertido', 'perdido'].includes(l.status)).length
  const negociacoes = data.leads.filter((l) =>
    ['visita', 'proposta', 'negociacao', 'contrato'].includes(l.status),
  ).length

  const kpis = [
    {
      label: 'Imóveis cadastrados',
      value: formatCount(data.imoveis.length),
      delta: `${formatCount(data.imoveis.filter((i) => isThisMonth(i.created_at)).length)} este mês`,
      icon: Building2,
      tone: 'gold' as Tone,
    },
    {
      label: 'Leads ativos',
      value: formatCount(leadsAtivos),
      delta: `${formatCount(data.leads.filter((l) => isThisMonth(l.created_at)).length)} este mês`,
      icon: Users,
      tone: 'dark' as Tone,
    },
    {
      label: 'Negociações',
      value: formatCount(negociacoes),
      delta: 'Leads em andamento',
      icon: Handshake,
      tone: 'gold' as Tone,
    },
    {
      label: 'Vendas (mês)',
      value: formatCurrencyBRL(vendasMes),
      delta: 'Contratos de venda',
      icon: DollarSign,
      tone: 'dark' as Tone,
    },
  ]

  const salesData = Array.from({ length: 6 }, (_, index) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - index))
    const month = d.getMonth()
    const year = d.getFullYear()
    const valor = data.contratos
      .filter((c) => {
        const created = new Date(c.created_at)
        return (
          c.tipo === 'venda' &&
          c.status !== 'cancelado' &&
          created.getMonth() === month &&
          created.getFullYear() === year
        )
      })
      .reduce((sum, c) => sum + Number(c.valor || 0), 0)

    return {
      mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
      valor,
    }
  })

  const typeData = (Object.keys(TYPE_LABELS) as PropertyType[])
    .map((type) => {
      const value = data.imoveis.filter((i) => i.tipo === type).length
      const pct = data.imoveis.length ? Math.round((value / data.imoveis.length) * 100) : 0
      return {
        name: TYPE_LABELS[type],
        value,
        pct,
        color: TYPE_COLORS[type],
      }
    })
    .filter((item) => item.value > 0)

  const activities = [
    ...data.imoveis.slice(0, 3).map((imovel) => ({
      icon: Building2,
      title: 'Imóvel cadastrado',
      text: imovel.titulo,
      time: formatRelativeTime(imovel.created_at),
      date: imovel.created_at,
    })),
    ...data.leads.slice(0, 3).map((lead) => ({
      icon: UserPlus,
      title: 'Lead recebido',
      text: getRelatedTitle(lead.imoveis)
        ? `${lead.name} - ${getRelatedTitle(lead.imoveis)}`
        : lead.name,
      time: formatRelativeTime(lead.created_at),
      date: lead.created_at,
    })),
    ...data.contratos.slice(0, 3).map((contrato) => ({
      icon: FileSignature,
      title: 'Contrato criado',
      text: getRelatedTitle(contrato.imoveis) ?? formatCurrencyBRL(Number(contrato.valor || 0)),
      time: formatRelativeTime(contrato.created_at),
      date: contrato.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  const mostViewed = data.imoveis
    .filter((i) => i.visualizacoes > 0)
    .slice(0, 4)

  const funnelBase = data.leads.length
  const funnel = [
    { stage: 'Leads', value: data.leads.length },
    {
      stage: 'Qualificados',
      value: data.leads.filter((l) => !['novo', 'perdido'].includes(l.status)).length,
    },
    { stage: 'Negociação', value: negociacoes },
    { stage: 'Fechados', value: data.leads.filter((l) => l.status === 'convertido').length },
  ].map((item, index) => {
    const pct = funnelBase ? Math.round((item.value / funnelBase) * 100) : 0
    return {
      ...item,
      pct,
      width: Math.max(pct, item.value ? 24 : 14),
      color: FUNNEL_COLORS[index],
    }
  })

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Não foi possível carregar o dashboard: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
                  k.tone === 'gold'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-primary text-white'
                }`}
              >
                <k.icon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted">{k.label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary">
                  {loading ? '...' : k.value}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="size-3.5" />
                  {loading ? 'Carregando' : k.delta}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Desempenho de vendas"
          className="xl:col-span-1"
          action={<span className="text-xs text-muted">Últimos 6 meses</span>}
        >
          <p className="font-display text-3xl font-bold text-primary">
            {loading ? '...' : formatCurrencyBRL(vendasMes)}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            Total de vendas no mês atual
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a853" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#d4a853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Number(v) / 1000}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrencyBRL(v)}
                  labelStyle={{ color: '#1a365d' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#d4a853"
                  strokeWidth={2.5}
                  fill="url(#goldFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Imóveis por tipo">
          {typeData.length ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {typeData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-primary">
                    {data.imoveis.length}
                  </span>
                  <span className="text-xs text-muted">Total</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {typeData.map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="flex-1 text-slate-700">{d.name}</span>
                    <span className="text-muted">
                      {d.pct}% ({d.value})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted">Nenhum imóvel cadastrado ainda.</p>
          )}
        </Panel>

        <Panel
          title="Atividades recentes"
          action={
            <Link href="/admin/notificacoes" className="text-xs font-medium text-accent">
              Ver todas
            </Link>
          }
        >
          {activities.length ? (
            <ul className="space-y-4">
              {activities.map((a) => (
                <li key={`${a.title}-${a.date}`} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <a.icon className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="truncate text-xs text-muted">{a.text}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {a.time}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nenhuma atividade recente.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Imóveis mais visualizados"
          action={
            <Link href="/admin/imoveis/novo" className="text-xs font-medium text-accent">
              Cadastrar imóvel
            </Link>
          }
        >
          {mostViewed.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">Imóvel</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Visualizações</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mostViewed.map((m) => {
                    const cover =
                      m.imovel_imagens
                        ?.slice()
                        .sort((a, b) => Number(b.is_capa) - Number(a.is_capa) || a.ordem - b.ordem)[0]
                        ?.url ?? null

                    return (
                      <tr key={m.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {cover ? (
                              <img
                                src={cover}
                                alt=""
                                className="size-11 rounded-lg object-cover"
                              />
                            ) : (
                              <span className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                <Building2 className="size-5" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800">{m.titulo}</p>
                              <p className="truncate text-xs text-muted">
                                {m.bairro}, {m.cidade}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600">{TYPE_LABELS[m.tipo]}</td>
                        <td className="py-3 text-slate-600">{formatCount(m.visualizacoes)}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">Nenhum imóvel com visualizações registradas.</p>
          )}
        </Panel>

        <Panel
          title="Funil de vendas"
          action={<span className="text-xs text-muted">Baseado nos leads</span>}
        >
          <div className="grid items-center gap-6 sm:grid-cols-[1.3fr_1fr]">
            <div className="flex flex-col items-center gap-1.5 py-2">
              {funnel.map((f) => (
                <div
                  key={f.stage}
                  className="flex h-12 items-center justify-center text-xs font-semibold text-white"
                  style={{
                    width: `${f.width}%`,
                    backgroundColor: f.color,
                    clipPath: 'polygon(6% 0, 94% 0, 88% 100%, 12% 100%)',
                  }}
                >
                  {f.value}
                </div>
              ))}
            </div>
            <ul className="space-y-3.5 text-sm">
              {funnel.map((f) => (
                <li key={f.stage} className="flex items-center gap-3">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: f.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-700">{f.stage}</p>
                    <p className="text-xs text-muted">{f.value}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{f.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  )
}
