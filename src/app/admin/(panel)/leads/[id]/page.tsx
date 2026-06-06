'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  addLeadComentario,
  addLeadTarefa,
  fetchLeadById,
  fetchLeadComentarios,
  fetchLeadHistorico,
  fetchLeadTarefas,
  toggleLeadTarefa,
} from '@/services/crm'
import { updateLeadStatus } from '@/services/leads'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { formatDatePt } from '@/lib/utils'
import type { LeadStatus } from '@/types'

export default function AdminLeadDetailPage() {
  const { id } = useParams() as { id: string }
  const supabase = useMemo(() => createClient(), [])
  const [lead, setLead] = useState<Awaited<ReturnType<typeof fetchLeadById>>>(null)
  const [hist, setHist] = useState<unknown[]>([])
  const [comentarios, setComentarios] = useState<unknown[]>([])
  const [tarefas, setTarefas] = useState<unknown[]>([])
  const [novoComentario, setNovoComentario] = useState('')
  const [novaTarefa, setNovaTarefa] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [l, h, c, t] = await Promise.all([
      fetchLeadById(id),
      fetchLeadHistorico(id),
      fetchLeadComentarios(id),
      fetchLeadTarefas(id),
    ])
    setLead(l)
    setHist(h)
    setComentarios(c)
    setTarefas(t)
  }, [id])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [supabase])

  async function enviarComentario() {
    if (!lead || !userId || !novoComentario.trim()) return
    await addLeadComentario({
      empresa_id: lead.empresa_id,
      lead_id: lead.id,
      usuario_id: userId,
      conteudo: novoComentario.trim(),
    })
    setNovoComentario('')
    void reload()
  }

  async function criarTarefa() {
    if (!lead || !novaTarefa.trim()) return
    await addLeadTarefa({
      empresa_id: lead.empresa_id,
      lead_id: lead.id,
      usuario_id: userId,
      titulo: novaTarefa.trim(),
    })
    setNovaTarefa('')
    void reload()
  }

  if (!lead) return <p className="text-muted">Carregando lead…</p>

  const statusOpts: LeadStatus[] = [
    'novo',
    'contato',
    'visita',
    'proposta',
    'negociacao',
    'contrato',
    'convertido',
    'perdido',
  ]

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/leads" className="text-sm text-primary hover:underline">
          ← Voltar aos leads
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-primary">{lead.name}</h1>
        <p className="text-muted">
          {lead.email} · {lead.phone} · Score: {lead.score ?? 0}
        </p>
        <p className="mt-2 text-sm">
          Status: <strong>{lead.status}</strong>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {statusOpts.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={lead.status === s ? 'primary' : 'secondary'}
              type="button"
              onClick={async () => {
                await updateLeadStatus(lead.id, s)
                void reload()
              }}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
        <h2 className="font-semibold text-primary">Timeline (histórico)</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {hist.map((row) => {
            const r = row as Record<string, unknown>
            return (
              <li key={String(r.id)} className="border-b border-slate-50 pb-2">
                <span className="text-xs text-muted">{formatDatePt(String(r.created_at))}</span>
                <span className="ml-2 font-medium">{String(r.tipo)}</span>
                <p className="text-slate-600">{String(r.conteudo)}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
        <h2 className="font-semibold text-primary">Comentários internos</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {comentarios.map((row) => {
            const r = row as Record<string, unknown>
            return (
              <li key={String(r.id)}>
                <span className="text-xs text-muted">{formatDatePt(String(r.created_at))}</span>
                <p>{String(r.conteudo)}</p>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Textarea
            rows={2}
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Novo comentário…"
          />
          <Button type="button" onClick={() => void enviarComentario()}>
            Enviar
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
        <h2 className="font-semibold text-primary">Tarefas</h2>
        <ul className="mt-4 space-y-2">
          {tarefas.map((row) => {
            const r = row as Record<string, unknown>
            return (
              <li key={String(r.id)} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(r.concluida)}
                  onChange={() => {
                    void (async () => {
                      await toggleLeadTarefa(String(r.id), !Boolean(r.concluida))
                      void reload()
                    })()
                  }}
                />
                <span className={r.concluida ? 'line-through text-muted' : ''}>{String(r.titulo)}</span>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input value={novaTarefa} onChange={(e) => setNovaTarefa(e.target.value)} placeholder="Nova tarefa" />
          <Button type="button" onClick={() => void criarTarefa()}>
            Adicionar
          </Button>
        </div>
      </section>
    </div>
  )
}
