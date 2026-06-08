'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Edit, EyeOff, Play, Plus, Trash2 } from 'lucide-react'
import type { ImovelRow, ImovelStatus } from '@/types'
import { deleteImovel, fetchMyImoveis, updateImovel } from '@/services/imoveis'
import { formatCurrencyBRL, getCoverImage } from '@/lib/utils'
import { IMOVEL_STATUS_LABELS, PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

const ACTIVE_STATUSES: ImovelStatus[] = ['disponivel', 'reservado']

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

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'todos') return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  const counts = useMemo(
    () => ({
      total: items.length,
      ativos: items.filter((item) => ACTIVE_STATUSES.includes(item.status)).length,
      pausados: items.filter((item) => item.status === 'oculto').length,
    }),
    [items],
  )

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Anúncios</h1>
          <p className="mt-1 text-muted">
            Liste, edite, pause, publique ou exclua os anúncios de imóveis.
          </p>
        </div>
        <Link href="/admin/imoveis/novo">
          <Button type="button" className="gap-2">
            <Plus className="size-4" />
            Novo anúncio
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-muted">Total</p>
          <p className="mt-1 font-display text-2xl font-bold text-primary">{counts.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-muted">Ativos</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-700">{counts.ativos}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-muted">Pausados</p>
          <p className="mt-1 font-display text-2xl font-bold text-slate-600">{counts.pausados}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: 'todos', label: 'Todos' },
          ...Object.entries(IMOVEL_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter(option.value as 'todos' | ImovelStatus)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              statusFilter === option.value
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-accent hover:text-primary'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
        {loading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs uppercase text-muted">
                  <th className="px-4 py-3">Anúncio</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Finalidade</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const cover = getCoverImage(item.imovel_imagens)
                  const paused = item.status === 'oculto'
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {cover ? (
                            <img
                              src={cover}
                              alt=""
                              className="size-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex size-14 items-center justify-center rounded-xl bg-slate-100 text-xs text-muted">
                              Sem foto
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{item.titulo}</p>
                            <p className="truncate text-xs text-muted">
                              {item.bairro}, {item.cidade}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{PROPERTY_TYPE_LABELS[item.tipo]}</td>
                      <td className="px-4 py-3 text-slate-700">{PURPOSE_LABELS[item.finalidade]}</td>
                      <td className="px-4 py-3 font-medium text-primary">
                        {formatCurrencyBRL(Number(item.preco))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={paused ? 'muted' : 'success'}>
                          {IMOVEL_STATUS_LABELS[item.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/imoveis/${item.id}`}>
                            <Button type="button" variant="secondary" size="sm">
                              <Edit className="size-4" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            loading={busyId === item.id}
                            onClick={() => void togglePause(item)}
                          >
                            {paused ? <Play className="size-4" /> : <EyeOff className="size-4" />}
                            {paused ? 'Ativar' : 'Pausar'}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="size-4" />
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="text-muted">Nenhum anúncio encontrado.</p>
            <Link href="/admin/imoveis/novo" className="mt-4 inline-flex">
              <Button type="button">Cadastrar primeiro anúncio</Button>
            </Link>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Excluir anúncio"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Tem certeza que deseja excluir o anúncio{' '}
            <strong>{deleteTarget?.titulo}</strong>? Essa ação não poderá ser desfeita.
          </p>
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
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
