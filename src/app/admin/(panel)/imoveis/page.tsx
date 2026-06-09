'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Edit, EyeOff, Play, Plus, Trash2, Building2, TrendingUp, Eye, AlertCircle } from 'lucide-react'
import type { ImovelRow, ImovelStatus } from '@/types'
import { deleteImovel, fetchMyImoveis, updateImovel } from '@/services/imoveis'
import { formatCurrencyBRL, getCoverImage } from '@/lib/utils'
import { IMOVEL_STATUS_LABELS, PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

const ACTIVE_STATUSES: ImovelStatus[] = ['disponivel', 'reservado']

const STATUS_STYLES: Record<ImovelStatus, string> = {
  disponivel: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  reservado:  'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  vendido:    'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  alugado:    'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  oculto:     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
}

const STATUS_DOT: Record<ImovelStatus, string> = {
  disponivel: 'bg-emerald-400',
  reservado:  'bg-blue-400',
  vendido:    'bg-slate-400',
  alugado:    'bg-violet-400',
  oculto:     'bg-amber-400',
}

export default function AdminImoveisPage() {
  const [items, setItems] = useState<ImovelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'todos' | ImovelStatus>('todos')
  const [deleteTarget, setDeleteTarget] = useState<ImovelRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMyImoveis()
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os anúncios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'todos') return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  const counts = useMemo(() => ({
    total:    items.length,
    ativos:   items.filter((item) => ACTIVE_STATUSES.includes(item.status)).length,
    ocultos:  items.filter((item) => item.status === 'oculto').length,
    vendidos: items.filter((item) => item.status === 'vendido' || item.status === 'alugado').length,
  }), [items])

  async function togglePause(item: ImovelRow) {
    const nextStatus: ImovelStatus = item.status === 'oculto' ? 'disponivel' : 'oculto'
    setBusyId(item.id)
    setError(null)
    try {
      const updated = await updateImovel(item.id, { status: nextStatus })
      setItems((prev) => prev.map((row) => (row.id === item.id ? updated : row)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar o anúncio.')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setError(null)
    try {
      await deleteImovel(deleteTarget.id)
      setItems((prev) => prev.filter((row) => row.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir o anúncio.')
    } finally {
      setBusyId(null)
    }
  }

  const filterOptions: { value: 'todos' | ImovelStatus; label: string; count?: number }[] = [
    { value: 'todos', label: 'Todos', count: counts.total },
    ...( Object.entries(IMOVEL_STATUS_LABELS) as [ImovelStatus, string][]).map(([value, label]) => ({
      value,
      label,
      count: items.filter((i) => i.status === value).length,
    })),
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Catálogo</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-800 sm:text-3xl">Imóveis</h1>
        </div>
        <Link href="/admin/imoveis/novo">
          <Button type="button" className="gap-2 shadow-sm">
            <Plus className="size-4" />
            Novo imóvel
          </Button>
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total cadastrado',
            value: counts.total,
            icon: Building2,
            color: 'text-primary',
            bg: 'bg-primary/8',
          },
          {
            label: 'Disponíveis / Reservados',
            value: counts.ativos,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Vendidos / Alugados',
            value: counts.vendidos,
            icon: Eye,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Ocultos',
            value: counts.ocultos,
            icon: AlertCircle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon className={`size-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === opt.value
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                statusFilter === opt.value ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {opt.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
            <Spinner size="lg" />
            <p className="text-sm">Carregando imóveis…</p>
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Imóvel
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Tipo / Finalidade
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => {
                  const cover = getCoverImage(item.imovel_imagens)
                  const paused = item.status === 'oculto'
                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-100">
                            {cover ? (
                              <img src={cover} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-slate-100 text-slate-300">
                                <Building2 className="size-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{item.titulo}</p>
                            <p className="truncate text-xs text-slate-400">
                              {item.bairro}, {item.cidade}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700">{PROPERTY_TYPE_LABELS[item.tipo]}</p>
                        <p className="text-xs text-slate-400">{PURPOSE_LABELS[item.finalidade]}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-primary">
                          {formatCurrencyBRL(Number(item.preco))}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[item.status]}`}>
                          <span className={`size-1.5 rounded-full ${STATUS_DOT[item.status]}`} />
                          {IMOVEL_STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/imoveis/${item.id}`}>
                            <Button type="button" variant="secondary" size="sm" className="gap-1.5">
                              <Edit className="size-3.5" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            loading={busyId === item.id}
                            onClick={() => void togglePause(item)}
                            className="gap-1.5"
                          >
                            {paused ? <Play className="size-3.5" /> : <EyeOff className="size-3.5" />}
                            {paused ? 'Ativar' : 'Pausar'}
                          </Button>
                          <button
                            type="button"
                            title="Excluir"
                            onClick={() => setDeleteTarget(item)}
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100">
              <Building2 className="size-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Nenhum imóvel encontrado</p>
              <p className="mt-1 text-sm text-slate-400">
                {statusFilter === 'todos'
                  ? 'Comece cadastrando seu primeiro imóvel.'
                  : 'Nenhum imóvel com esse status.'}
              </p>
            </div>
            {statusFilter === 'todos' && (
              <Link href="/admin/imoveis/novo">
                <Button type="button">
                  <Plus className="size-4" />
                  Cadastrar imóvel
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete modal */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Excluir imóvel">
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
            <p className="text-sm text-slate-700">
              Tem certeza que deseja excluir{' '}
              <strong className="text-slate-900">{deleteTarget?.titulo}</strong>?{' '}
              Essa ação não poderá ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={Boolean(deleteTarget && busyId === deleteTarget.id)}
              onClick={() => void confirmDelete()}
            >
              Sim, excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
