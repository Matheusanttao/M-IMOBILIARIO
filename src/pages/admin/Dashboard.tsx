import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  deleteProperty,
  fetchMyProperties,
  updateProperty,
} from '@/services/properties'
import { countLeadsForUser } from '@/services/leads'
import type { PropertyRow } from '@/types'
import { formatCurrencyBRL, formatDatePt } from '@/lib/utils'
import { PURPOSE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

export function Dashboard() {
  const [items, setItems] = useState<PropertyRow[]>([])
  const [leadCount, setLeadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [props, leads] = await Promise.all([
        fetchMyProperties(),
        countLeadsForUser(),
      ])
      setItems(props)
      setLeadCount(leads)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este imóvel e todas as imagens vinculadas?')) return
    setBusyId(id)
    try {
      await deleteProperty(id)
      setItems((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao excluir')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleStatus(p: PropertyRow) {
    const next = p.status === 'ativo' ? 'inativo' : 'ativo'
    setBusyId(p.id)
    try {
      await updateProperty(p.id, { status: next })
      setItems((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar')
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = items.filter((p) => p.status === 'ativo').length

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Dashboard</h1>
          <p className="mt-1 text-muted">Gerencie seus anúncios e acompanhe leads.</p>
        </div>
        <Link
          to="/admin/imoveis/novo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-primary-hover hover:shadow-lg"
        >
          <Plus className="size-4" />
          Novo imóvel
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total de imóveis', value: items.length },
          { label: 'Ativos', value: activeCount },
          { label: 'Leads recebidos', value: leadCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md"
          >
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <p className="p-6 text-red-700">{error}</p>
        ) : !items.length ? (
          <p className="p-8 text-center text-muted">
            Nenhum imóvel cadastrado.{' '}
            <Link to="/admin/imoveis/novo" className="font-medium text-primary underline">
              Criar primeiro
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-surface/80 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Finalidade</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Atualizado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.title}</td>
                    <td className="px-4 py-3">{PROPERTY_TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-3">{PURPOSE_LABELS[p.purpose]}</td>
                    <td className="px-4 py-3">{formatCurrencyBRL(p.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'ativo' ? 'success' : 'muted'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDatePt(p.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          title={p.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          disabled={busyId === p.id}
                          onClick={() => toggleStatus(p)}
                        >
                          {p.status === 'ativo' ? (
                            <ToggleRight className="size-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="size-5 text-slate-400" />
                          )}
                        </Button>
                        <Link
                          to={`/admin/imoveis/${p.id}`}
                          title="Editar"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-primary hover:bg-slate-100"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-red-600 hover:bg-red-50"
                          title="Excluir"
                          disabled={busyId === p.id}
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
