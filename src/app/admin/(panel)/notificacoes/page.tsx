'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDatePt } from '@/lib/utils'

type N = {
  id: string
  titulo: string
  mensagem: string
  lida: boolean
  link: string | null
  created_at: string
}

export default function AdminNotificacoesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<N[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('notificacoes')
        .select('id, titulo, mensagem, lida, link, created_at')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!cancelled) setItems((data as N[]) ?? [])
    }
    void load()

    const ch = supabase
      .channel('notificacoes-admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        (payload) => {
          const row = payload.new as N
          setItems((prev) => [row, ...prev])
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(ch)
    }
  }, [supabase])

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Central de notificações</h1>
      <p className="mt-1 text-muted">Eventos em tempo real (Realtime) e histórico recente.</p>
      <ul className="mt-8 space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-semibold text-primary">{n.titulo}</p>
              <span className="text-xs text-muted">{formatDatePt(n.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{n.mensagem}</p>
            {n.link ? (
              <a href={n.link} className="mt-2 inline-block text-sm text-accent underline">
                Abrir link
              </a>
            ) : null}
          </li>
        ))}
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-muted">
            Nenhuma notificação ainda.
          </li>
        ) : null}
      </ul>
    </div>
  )
}
