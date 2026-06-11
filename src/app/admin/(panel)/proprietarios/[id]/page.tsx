'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Banknote, CheckCircle2, UserRound, WalletCards } from 'lucide-react'
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
    <div className="w-full space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-primary via-slate-900 to-slate-800 px-5 py-6 text-white sm:px-7 sm:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Cadastro de proprietário
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            {isNew ? 'Novo proprietário' : form.nome}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
            Cadastre dados pessoais, contatos e informações bancárias do
            proprietário para vínculo com os imóveis.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Dados principais
              </h2>
              <p className="text-xs text-muted">
                Identificação e contatos do proprietário.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
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
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Banknote className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Dados bancários
              </h2>
              <p className="text-xs text-muted">
                Informações de repasse e pagamento.
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <Input label="Banco" value={form.banco ?? ''} onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))} />
          <Input label="Agência" value={form.agencia ?? ''} onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))} />
          <Input label="Conta" value={form.conta ?? ''} onChange={(e) => setForm((f) => ({ ...f, conta: e.target.value }))} />
          <Input
            label="Tipo de conta"
            value={form.tipo_conta ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, tipo_conta: e.target.value }))}
          />
          <Input
            label="Chave PIX"
            value={form.chave_pix ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, chave_pix: e.target.value }))}
          />
          <Input
            label="Tipo da chave PIX"
            value={form.tipo_chave_pix ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, tipo_chave_pix: e.target.value }))}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <WalletCards className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Observações e status
              </h2>
              <p className="text-xs text-muted">
                Informações internas para a equipe.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <Textarea
            label="Observações internas"
            rows={4}
            value={form.observacoes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
          />
          <label className="flex min-h-[74px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:border-accent/40 hover:bg-accent/5">
            <input
              type="checkbox"
              checked={form.ativo ?? true}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
              className="size-4 rounded border-slate-300 text-accent focus:ring-accent"
            />
            Proprietário ativo
          </label>
        </div>
      </section>

      <div className="sticky bottom-4 z-20 rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Pronto para salvar?
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Revise os dados antes de gravar o proprietário.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" size="lg" loading={saving} onClick={() => void handleSave()}>
              Salvar proprietário
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.push('/admin/proprietarios')}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>

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
      <h2 className="font-semibold text-primary">Imóveis vinculados</h2>
      <p className="mt-1 text-sm text-muted">
        {links.length} vínculo(s). Configure a participação deste proprietário
        diretamente no cadastro do imóvel.
      </p>
    </div>
  )
}
