'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  fetchProprietarioById,
  fetchImoveisDoProprietario,
  saveProprietario,
} from '@/services/proprietarios'
import type { ProprietarioRow } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { createClient } from '@/lib/supabase/client'

const empty: Partial<ProprietarioRow> = {
  nome: '',
  email: '',
  telefone: '',
  documento: '',
  cpf_cnpj: '',
  rg_ie: '',
  whatsapp: '',
  chave_pix: '',
  tipo_chave_pix: '',
  banco: '',
  agencia: '',
  conta: '',
  tipo_conta: '',
  observacoes: '',
  ativo: true,
}

export default function AdminProprietarioDetailPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const idParam = params?.id ?? ''
  const isNew = idParam === 'novo'

  const supabase = useMemo(() => createClient(), [])
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<ProprietarioRow>>(empty)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (isNew) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: u } = await supabase.from('usuarios').select('empresa_id').eq('id', user.id).single()
      setEmpresaId((u?.empresa_id as string) ?? null)
      setLoading(false)
      return
    }
    setLoading(true)
    const row = await fetchProprietarioById(idParam)
    if (row) {
      setForm({ ...empty, ...row })
      setEmpresaId(row.empresa_id)
    }
    setLoading(false)
  }, [idParam, isNew, supabase])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (!empresaId || !form.nome?.trim()) return
    setSaving(true)
    try {
      const payload = {
        empresa_id: empresaId,
        nome: form.nome.trim(),
        email: form.email?.trim() || null,
        telefone: form.telefone?.trim() || null,
        documento: form.documento?.trim() || null,
        cpf_cnpj: form.cpf_cnpj?.trim() || null,
        rg_ie: form.rg_ie?.trim() || null,
        whatsapp: form.whatsapp?.trim() || null,
        chave_pix: form.chave_pix?.trim() || null,
        tipo_chave_pix: form.tipo_chave_pix?.trim() || null,
        banco: form.banco?.trim() || null,
        agencia: form.agencia?.trim() || null,
        conta: form.conta?.trim() || null,
        tipo_conta: form.tipo_conta?.trim() || null,
        observacoes: form.observacoes?.trim() || null,
        ativo: form.ativo ?? true,
      }
      const newId = await saveProprietario(payload, isNew ? null : idParam)
      if (isNew) router.replace(`/admin/proprietarios/${newId}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted">Carregando…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">
        {isNew ? 'Novo proprietário' : form.nome}
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome" value={form.nome ?? ''} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
        <Input
          label="CPF / CNPJ"
          value={form.cpf_cnpj ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
        />
        <Input label="RG / IE" value={form.rg_ie ?? ''} onChange={(e) => setForm((f) => ({ ...f, rg_ie: e.target.value }))} />
        <Input
          label="Telefone"
          value={form.telefone ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
        />
        <Input
          label="WhatsApp"
          value={form.whatsapp ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
        />
        <Input label="E-mail" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <Input label="Banco" value={form.banco ?? ''} onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))} />
        <Input label="Agência" value={form.agencia ?? ''} onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))} />
        <Input label="Conta" value={form.conta ?? ''} onChange={(e) => setForm((f) => ({ ...f, conta: e.target.value }))} />
        <Input
          label="Chave PIX"
          value={form.chave_pix ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, chave_pix: e.target.value }))}
        />
      </div>
      <Textarea
        label="Observações internas"
        rows={4}
        value={form.observacoes ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.ativo ?? true}
          onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
          className="size-4 rounded border-slate-300"
        />
        Ativo
      </label>
      <Button type="button" loading={saving} onClick={() => void handleSave()}>
        Salvar
      </Button>

      {!isNew ? <ProprietarioImoveisBlock proprietarioId={idParam} /> : null}
    </div>
  )
}

function ProprietarioImoveisBlock({ proprietarioId }: { proprietarioId: string }) {
  const [links, setLinks] = useState<Awaited<ReturnType<typeof fetchImoveisDoProprietario>>>([])

  useEffect(() => {
    void fetchImoveisDoProprietario(proprietarioId).then(setLinks)
  }, [proprietarioId])

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
      <h2 className="font-semibold text-primary">Imóveis vinculados (N:N)</h2>
      <p className="mt-1 text-sm text-muted">
        {links.length} vínculo(s). Configure participação no cadastro do imóvel (evolução).
      </p>
    </div>
  )
}
