'use client'

import { useEffect, useState, useCallback, useMemo, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrencyBRL } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

interface Plano {
  id: string
  nome: string
  slug: string
  preco_mensal: number
  limite_imoveis: number | null
  limite_corretores: number | null
  limite_leads: number | null
  recursos: Record<string, unknown>
  ativo: boolean
  created_at: string
}

const EMPTY_FORM = {
  nome: '',
  slug: '',
  preco_mensal: '',
  limite_imoveis: '',
  limite_corretores: '',
  limite_leads: '',
  recursos: '{}',
}

export default function MasterPlanosPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [planos, setPlanos] = useState<Plano[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPlanos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('planos').select('*').order('preco_mensal')
    setPlanos((data as Plano[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadPlanos()
  }, [loadPlanos])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  function openEdit(p: Plano) {
    setEditingId(p.id)
    setForm({
      nome: p.nome,
      slug: p.slug,
      preco_mensal: String(p.preco_mensal),
      limite_imoveis: p.limite_imoveis != null ? String(p.limite_imoveis) : '',
      limite_corretores: p.limite_corretores != null ? String(p.limite_corretores) : '',
      limite_leads: p.limite_leads != null ? String(p.limite_leads) : '',
      recursos: JSON.stringify(p.recursos, null, 2),
    })
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (!form.nome.trim() || !form.slug.trim()) {
      setError('Nome e slug são obrigatórios.')
      return
    }

    let recursosObj: Record<string, unknown> = {}
    try {
      recursosObj = JSON.parse(form.recursos || '{}')
    } catch {
      setError('JSON de recursos inválido.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      nome: form.nome.trim(),
      slug: form.slug.trim().toLowerCase(),
      preco_mensal: Number(form.preco_mensal) || 0,
      limite_imoveis: form.limite_imoveis ? Number(form.limite_imoveis) : null,
      limite_corretores: form.limite_corretores ? Number(form.limite_corretores) : null,
      limite_leads: form.limite_leads ? Number(form.limite_leads) : null,
      recursos: recursosObj,
    }

    let err: string | null = null
    if (editingId) {
      const { error: e } = await supabase.from('planos').update(payload).eq('id', editingId)
      err = e?.message ?? null
    } else {
      const { error: e } = await supabase.from('planos').insert(payload)
      err = e?.message ?? null
    }

    setSaving(false)
    if (err) {
      setError(err)
      return
    }
    setModalOpen(false)
    loadPlanos()
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('planos').delete().eq('id', deleteId)
    setDeleting(false)
    setDeleteId(null)
    loadPlanos()
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Planos</h1>
          <p className="mt-1 text-muted">{planos.length} plano(s) cadastrado(s)</p>
        </div>
        <Button onClick={openCreate}>Novo plano</Button>
      </div>

      {planos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-md">
          <p className="text-muted">Nenhum plano cadastrado.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map((p) => (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-primary">{p.nome}</h3>
                    <p className="text-sm text-muted">{p.slug}</p>
                  </div>
                  <Badge variant={p.ativo ? 'success' : 'muted'}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <p className="mt-4 font-display text-3xl font-bold text-blue-600">
                  {formatCurrencyBRL(Number(p.preco_mensal))}
                  <span className="text-base font-normal text-muted">/mês</span>
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Imóveis</span>
                    <span className="font-medium text-slate-800">
                      {p.limite_imoveis ?? 'Ilimitado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Corretores</span>
                    <span className="font-medium text-slate-800">
                      {p.limite_corretores ?? 'Ilimitado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Leads</span>
                    <span className="font-medium text-slate-800">
                      {p.limite_leads ?? 'Ilimitado'}
                    </span>
                  </div>
                </div>

                {Object.keys(p.recursos).length > 0 && (
                  <div className="mt-4">
                    <p className="mb-1 text-xs font-semibold uppercase text-muted">Recursos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(p.recursos).map(([key, val]) => (
                        <Badge key={key} variant="outline">
                          {key}: {String(val)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteId(p.id)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar plano' : 'Novo plano'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
          )}
          <Input
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
          <Input
            label="Preço mensal (R$)"
            type="number"
            step="0.01"
            min="0"
            value={form.preco_mensal}
            onChange={(e) => setForm({ ...form, preco_mensal: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Limite imóveis"
              type="number"
              min="0"
              placeholder="Ilimitado"
              value={form.limite_imoveis}
              onChange={(e) => setForm({ ...form, limite_imoveis: e.target.value })}
            />
            <Input
              label="Limite corretores"
              type="number"
              min="0"
              placeholder="Ilimitado"
              value={form.limite_corretores}
              onChange={(e) => setForm({ ...form, limite_corretores: e.target.value })}
            />
            <Input
              label="Limite leads"
              type="number"
              min="0"
              placeholder="Ilimitado"
              value={form.limite_leads}
              onChange={(e) => setForm({ ...form, limite_leads: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Recursos (JSON)</label>
            <textarea
              value={form.recursos}
              onChange={(e) => setForm({ ...form, recursos: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm text-slate-800 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar exclusão"
      >
        <p className="text-slate-600">
          Tem certeza que deseja excluir este plano? Assinaturas vinculadas podem ser afetadas.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleting} onClick={confirmDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
