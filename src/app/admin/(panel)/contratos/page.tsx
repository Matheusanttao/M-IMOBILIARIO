'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createContrato, fetchContratos } from '@/services/contratos'
import type { ImovelRow, LeadRow } from '@/types'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

type ContratoRow = {
  id: string
  tipo: 'venda' | 'aluguel'
  valor: number
  status: 'rascunho' | 'aguardando_assinatura' | 'ativo' | 'encerrado' | 'cancelado'
  data_inicio: string | null
  data_fim: string | null
  imoveis?: { titulo?: string } | null
}

type ImovelOption = Pick<ImovelRow, 'id' | 'titulo' | 'empresa_id' | 'finalidade' | 'preco'>

export default function AdminContratosPage() {
  const supabase = useMemo(() => createClient(), [])
  const [contratos, setContratos] = useState<ContratoRow[]>([])
  const [imoveis, setImoveis] = useState<ImovelOption[]>([])
  const [leads, setLeads] = useState<Pick<LeadRow, 'id' | 'name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadContratos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const c = await fetchContratos()
      setContratos(c as ContratoRow[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar contratos.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDropdowns = useCallback(async () => {
    const [imRes, leadRes] = await Promise.all([
      supabase
        .from('imoveis')
        .select('id, titulo, empresa_id, finalidade, preco')
        .order('titulo'),
      supabase.from('leads').select('id, name').order('name'),
    ])
    if (imRes.data) setImoveis(imRes.data as ImovelOption[])
    if (leadRes.data) setLeads(leadRes.data as Pick<LeadRow, 'id' | 'name'>[])
  }, [supabase])

  useEffect(() => {
    void loadContratos()
  }, [loadContratos])

  useEffect(() => {
    void loadDropdowns()
  }, [loadDropdowns])

  function handleCreated() {
    setCreateOpen(false)
    void loadContratos()
  }

  function formatCurrency(value: number) {
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const statusLabels: Record<ContratoRow['status'], string> = {
    rascunho: 'Rascunho',
    aguardando_assinatura: 'Aguardando assinatura',
    ativo: 'Ativo',
    encerrado: 'Encerrado',
    cancelado: 'Cancelado',
  }

  const typeLabels: Record<ContratoRow['tipo'], string> = {
    venda: 'Venda',
    aluguel: 'Aluguel',
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Contratos</h1>
          <p className="mt-1 text-muted">Contratos vinculados aos imóveis.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Novo contrato
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-md">
        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : loading ? (
          <div className="flex justify-center p-10">
            <Spinner />
          </div>
        ) : contratos.length ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs uppercase text-muted">
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Imóvel</th>
                <th className="px-3 py-2">Início</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((contrato) => (
                <tr key={contrato.id} className="border-b border-slate-50">
                  <td className="px-3 py-2">{formatCurrency(contrato.valor)}</td>
                  <td className="px-3 py-2">{typeLabels[contrato.tipo]}</td>
                  <td className="px-3 py-2">{statusLabels[contrato.status]}</td>
                  <td className="px-3 py-2">{contrato.imoveis?.titulo ?? '-'}</td>
                  <td className="px-3 py-2">{contrato.data_inicio ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6">
            <p className="text-sm text-muted">Nenhum contrato cadastrado ainda.</p>
            <Button type="button" className="mt-4" onClick={() => setCreateOpen(true)}>
              Cadastrar contrato
            </Button>
          </div>
        )}
      </div>

      <CreateContratoModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
        imoveis={imoveis}
        leads={leads}
      />
    </div>
  )
}

function CreateContratoModal({
  open,
  onClose,
  onCreated,
  imoveis,
  leads,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  imoveis: ImovelOption[]
  leads: Pick<LeadRow, 'id' | 'name'>[]
}) {
  const [imovelId, setImovelId] = useState('')
  const [leadId, setLeadId] = useState('')
  const [tipo, setTipo] = useState<'venda' | 'aluguel'>('venda')
  const [valor, setValor] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [status, setStatus] = useState<ContratoRow['status']>('rascunho')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setImovelId('')
    setLeadId('')
    setTipo('venda')
    setValor('')
    setDataInicio('')
    setDataFim('')
    setStatus('rascunho')
    setError(null)
  }, [open])

  useEffect(() => {
    const selected = imoveis.find((imovel) => imovel.id === imovelId)
    if (!selected) return
    setTipo(selected.finalidade === 'aluguel' ? 'aluguel' : 'venda')
    setValor(String(selected.preco ?? ''))
  }, [imovelId, imoveis])

  async function handleSubmit() {
    const selected = imoveis.find((imovel) => imovel.id === imovelId)
    const parsedValue = Number(valor)

    if (!selected) {
      setError('Selecione um imóvel.')
      return
    }

    if (!parsedValue || parsedValue <= 0) {
      setError('Informe um valor válido.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await createContrato({
        empresa_id: selected.empresa_id,
        imovel_id: selected.id,
        lead_id: leadId || null,
        tipo,
        valor: parsedValue,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        status,
      })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao cadastrar contrato.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo contrato">
      <div className="space-y-4">
        <Select
          label="Imóvel"
          placeholder="Selecione o imóvel"
          value={imovelId}
          onChange={(e) => setImovelId(e.target.value)}
          options={imoveis.map((imovel) => ({
            value: imovel.id,
            label: imovel.titulo,
          }))}
        />

        <Select
          label="Lead / cliente (opcional)"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          options={[
            { value: '', label: 'Nenhum' },
            ...leads.map((lead) => ({ value: lead.id, label: lead.name })),
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as 'venda' | 'aluguel')}
            options={[
              { value: 'venda', label: 'Venda' },
              { value: 'aluguel', label: 'Aluguel' },
            ]}
          />
          <Input
            label="Valor"
            type="number"
            min="0"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Data de início"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <Input
            label="Data de fim (opcional)"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ContratoRow['status'])}
          options={[
            { value: 'rascunho', label: 'Rascunho' },
            { value: 'aguardando_assinatura', label: 'Aguardando assinatura' },
            { value: 'ativo', label: 'Ativo' },
            { value: 'encerrado', label: 'Encerrado' },
            { value: 'cancelado', label: 'Cancelado' },
          ]}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} loading={saving}>
            Salvar contrato
          </Button>
        </div>
      </div>
    </Modal>
  )
}
