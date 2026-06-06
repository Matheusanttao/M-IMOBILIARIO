'use client'

import Link from 'next/link'
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
  FileText,
  Handshake,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/utils'

const kpis = [
  {
    label: 'Imóveis cadastrados',
    value: '248',
    delta: '12% este mês',
    icon: Building2,
    tone: 'gold' as const,
  },
  {
    label: 'Leads ativos',
    value: '156',
    delta: '18% este mês',
    icon: Users,
    tone: 'dark' as const,
  },
  {
    label: 'Negociações',
    value: '32',
    delta: '8% este mês',
    icon: Handshake,
    tone: 'gold' as const,
  },
  {
    label: 'Vendas (mês)',
    value: 'R$ 1.248.000',
    delta: '25% este mês',
    icon: DollarSign,
    tone: 'dark' as const,
  },
]

const salesData = [
  { dia: '01/05', valor: 280000 },
  { dia: '05/05', valor: 360000 },
  { dia: '10/05', valor: 540000 },
  { dia: '15/05', valor: 680000 },
  { dia: '20/05', valor: 760000 },
  { dia: '25/05', valor: 980000 },
  { dia: '31/05', valor: 1248000 },
]

const typeData = [
  { name: 'Apartamentos', value: 104, pct: 42, color: '#d4a853' },
  { name: 'Casas', value: 69, pct: 28, color: '#1f2d3d' },
  { name: 'Terrenos', value: 37, pct: 15, color: '#64748b' },
  { name: 'Comerciais', value: 25, pct: 10, color: '#94a3b8' },
  { name: 'Outros', value: 13, pct: 5, color: '#cbd5e1' },
]

const activities = [
  {
    icon: Building2,
    title: 'Novo imóvel cadastrado',
    text: 'Apartamento no Itaim Bibi',
    time: 'Há 2h',
  },
  {
    icon: UserPlus,
    title: 'Novo lead recebido',
    text: 'Mariana Silva - Interesse em cobertura',
    time: 'Há 3h',
  },
  {
    icon: FileText,
    title: 'Proposta enviada',
    text: 'Casa em Alphaville para João Santos',
    time: 'Há 5h',
  },
  {
    icon: TrendingUp,
    title: 'Negociação atualizada',
    text: 'Venda - Apartamento Jardins',
    time: 'Há 1 dia',
  },
  {
    icon: FileSignature,
    title: 'Contrato assinado',
    text: 'Locação - Sala Comercial Vila Olímpia',
    time: 'Há 2 dias',
  },
]

const mostViewed = [
  {
    titulo: 'Cobertura Duplex',
    local: 'Itaim Bibi, São Paulo - SP',
    tipo: 'Apartamento',
    views: '1.245',
    img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=200&q=80',
  },
  {
    titulo: 'Casa em Alphaville',
    local: 'Alphaville, Santana de Parnaíba - SP',
    tipo: 'Casa',
    views: '987',
    img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=200&q=80',
  },
  {
    titulo: 'Sala Comercial',
    local: 'Vila Olímpia, São Paulo - SP',
    tipo: 'Comercial',
    views: '756',
    img: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=200&q=80',
  },
  {
    titulo: 'Terreno Residencial',
    local: 'Tamboré, Santana de Parnaíba - SP',
    tipo: 'Terreno',
    views: '643',
    img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=200&q=80',
  },
]

const funnel = [
  { stage: 'Leads', value: 156, pct: 100, width: 100, color: '#1f2d3d' },
  { stage: 'Qualificados', value: 89, pct: 57, width: 80, color: '#3b4a5e' },
  { stage: 'Propostas', value: 45, pct: 29, width: 62, color: '#64748b' },
  { stage: 'Negociação', value: 23, pct: 15, width: 46, color: '#b8923f' },
  { stage: 'Fechados', value: 12, pct: 8, width: 32, color: '#d4a853' },
]

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
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
                  {k.value}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="size-3.5" />
                  {k.delta}
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
          action={<span className="text-xs text-muted">Este mês</span>}
        >
          <p className="font-display text-3xl font-bold text-primary">
            {formatCurrencyBRL(1248000)}
          </p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            Total de vendas
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <ArrowUpRight className="size-3.5" /> 25% vs mês anterior
            </span>
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
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
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
                <span className="font-display text-2xl font-bold text-primary">248</span>
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
        </Panel>

        <Panel
          title="Atividades recentes"
          action={
            <button type="button" className="text-xs font-medium text-accent">
              Ver todas
            </button>
          }
        >
          <ul className="space-y-4">
            {activities.map((a) => (
              <li key={a.title} className="flex items-start gap-3">
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
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Imóveis mais visualizados"
          action={
            <Link href="/admin" className="text-xs font-medium text-accent">
              Ver todos
            </Link>
          }
        >
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
                {mostViewed.map((m) => (
                  <tr key={m.titulo}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.img}
                          alt=""
                          className="size-11 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">{m.titulo}</p>
                          <p className="truncate text-xs text-muted">{m.local}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{m.tipo}</td>
                    <td className="py-3 text-slate-600">{m.views}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        Disponível
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Funil de vendas"
          action={<span className="text-xs text-muted">Este mês</span>}
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
