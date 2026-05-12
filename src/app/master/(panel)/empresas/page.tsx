'use client'

import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDatePt } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'

interface Empresa {
  id: string
  nome: string
  slug: string
  email: string | null
  telefone: string | null
  documento: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  cor_primaria: string
  cor_secundaria: string
  ativa: boolean
  created_at: string
  plano_nome?: string
}

interface EmpresaStats {
  [empresaId: string]: { imoveis: number; leads: number }
}

const EMPTY_FORM = {
  nome: '',
  slug: '',
  email: '',
  telefone: '',
  documento: '',
  endereco: '',
  cidade: '',
  estado: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  cor_primaria: '#1a365d',
  cor_secundaria: '#d4a853',
}

export default function MasterEmpresasPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [stats, setStats] = useState<EmpresaStats>({})
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadEmpresas = useCallback(async () => {
    setLoading(true)

    const { data: rows } = await supabase
      .from('empresas')
      .select('*, assinaturas(plano_id, planos(nome))')
      .order('created_at', { ascending: false })

    const mapped = (rows ?? []).map((r) => {
      const assArr = r.assinaturas as unknown as Array<{
        planos: { nome: string } | null
      }> | null
      const planoNome = assArr?.[0]?.planos?.nome ?? '—'
      return { ...r, plano_nome: planoNome } as Empresa
    })
    setEmpresas(mapped)

    const ids = mapped.map((e) => e.id)
    if (ids.length > 0) {
      const [{ data: imoveisData }, { data: leadsData }] = await Promise.all([
        supabase.from('imoveis').select('empresa_id'),
        supabase.from('leads').select('empresa_id'),
      ])
      const statsMap: EmpresaStats = {}
      for (const id of ids) {
        statsMap[id] = {
          imoveis: (imoveisData ?? []).filter((i) => i.empresa_id === id).length,
          leads: (leadsData ?? []).filter((l) => l.empresa_id === id).length,
        }
      }
      setStats(statsMap)
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  function openEdit(e: Empresa) {
    setEditingId(e.id)
    setForm({
      nome: e.nome,
      slug: e.slug,
      email: e.email ?? '',
      telefone: e.telefone ?? '',
      documento: e.documento ?? '',
      endereco: e.endereco ?? '',
      cidade: e.cidade ?? '',
      estado: e.estado ?? '',
      whatsapp: e.whatsapp ?? '',
      instagram: e.instagram ?? '',
      facebook: e.facebook ?? '',
      cor_primaria: e.cor_primaria,
      cor_secundaria: e.cor_secundaria,
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
    setSaving(true)
    setError('')

    const payload = {
      nome: form.nome.trim(),
      slug: form.slug.trim().toLowerCase(),
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      documento: form.documento.trim() || null,
      endereco: form.endereco.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      instagram: form.instagram.trim() || null,
      facebook: form.facebook.trim() || null,
      cor_primaria: form.cor_primaria,
      cor_secundaria: form.cor_secundaria,
    }

    let err: string | null = null
    if (editingId) {
      const { error: e } = await supabase.from('empresas').update(payload).eq('id', editingId)
      err = e?.message ?? null
    } else {
      const { error: e } = await supabase.from('empresas').insert(payload)
      err = e?.message ?? null
    }

    setSaving(false)
    if (err) {
      setError(err)
      return
    }
    setModalOpen(false)
    loadEmpresas()
  }

  async function toggleAtiva(e: Empresa) {
    await supabase.from('empresas').update({ ativa: !e.ativa }).eq('id', e.id)
    loadEmpresas()
  }

  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('empresas').delete().eq('id', deleteId)
    setDeleting(false)
    setDeleteId(null)
    loadEmpresas()
  }

  const filtered = empresas.filter(
    (e) =>
      e.nome.toLowerCase().includes(search.toLowerCase()) ||
      e.slug.toLowerCase().includes(search.toLowerCase()) ||
      (e.email ?? '').toLowerCase().includes(search.toLowerCase()),
  )

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
          <h1 className="font-display text-3xl font-bold text-primary">Imobiliárias</h1>
          <p className="mt-1 text-muted">{empresas.length} empresa(s) cadastrada(s)</p>
        </div>
        <Button onClick={openCreate}>Nova empresa</Button>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome, slug ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Ativa</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Imóveis</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => openEdit(e)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{e.nome}</td>
                  <td className="px-4 py-3 text-muted">{e.slug}</td>
                  <td className="px-4 py-3 text-muted">{e.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        toggleAtiva(e)
                      }}
                    >
                      <Badge variant={e.ativa ? 'success' : 'muted'}>
                        {e.ativa ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted">{e.plano_nome}</td>
                  <td className="px-4 py-3 text-center">{stats[e.id]?.imoveis ?? 0}</td>
                  <td className="px-4 py-3 text-center">{stats[e.id]?.leads ?? 0}</td>
                  <td className="px-4 py-3 text-muted">{formatDatePt(e.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        setDeleteId(e.id)
                      }}
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar empresa' : 'Nova empresa'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
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
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
            <Input
              label="Documento (CNPJ/CPF)"
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
            />
            <Input
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
            <Input
              label="Endereço"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
            <Input
              label="Cidade"
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            />
            <Input
              label="Estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            />
            <Input
              label="Instagram"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
            <Input
              label="Facebook"
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Cor primária</label>
              <input
                type="color"
                value={form.cor_primaria}
                onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Cor secundária</label>
              <input
                type="color"
                value={form.cor_secundaria}
                onChange={(e) => setForm({ ...form, cor_secundaria: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border border-slate-200"
              />
            </div>
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
          Tem certeza que deseja excluir esta empresa? Todos os dados associados serão removidos
          permanentemente.
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
