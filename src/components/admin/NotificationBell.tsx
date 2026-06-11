'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export function NotificationBell() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .maybeSingle()

    const { count: personalCount } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .eq('lida', false)

    let broadcastCount = 0
    if (perfil?.empresa_id) {
      const { count: c } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .is('usuario_id', null)
        .eq('empresa_id', perfil.empresa_id)
        .eq('lida', false)
      broadcastCount = c ?? 0
    }

    setCount((personalCount ?? 0) + broadcastCount)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel('notificacoes-bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [refresh])

  return (
    <Link
      href="/admin/notificacoes"
      className="relative rounded-xl border border-slate-200 bg-white p-2 text-primary shadow-sm"
      title="Notificações"
    >
      <Bell className="size-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-primary">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  )
}
