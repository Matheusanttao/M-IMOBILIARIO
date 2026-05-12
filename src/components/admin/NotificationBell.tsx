'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

export function NotificationBell() {
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel('notificacoes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes' },
        () => {
          /* UI: incrementar contador ou toast */
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [])

  return (
    <button
      type="button"
      className="relative rounded-xl border border-slate-200 bg-white p-2 text-primary shadow-sm"
      title="Notificações (Realtime)"
    >
      <Bell className="size-5" />
      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
    </button>
  )
}
