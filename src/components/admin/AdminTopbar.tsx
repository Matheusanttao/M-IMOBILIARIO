'use client'

import { Search } from 'lucide-react'
import { NotificationBell } from '@/components/admin/NotificationBell'

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          Painel administrativo
        </h1>
        <p className="truncate text-sm text-muted">
          Bem-vindo ao painel da sua imobiliária
        </p>
      </div>

      <div className="hidden items-center md:flex">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar imóveis, clientes, leads..."
            className="w-72 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <NotificationBell />

      <div className="flex items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-primary">
          AD
        </div>
      </div>
    </header>
  )
}
