'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { NotificationBell } from '@/components/admin/NotificationBell'
import { usePermissions } from '@/hooks/usePermissions'

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Dashboard',
  imoveis: 'Imóveis',
  proprietarios: 'Clientes',
  leads: 'Leads',
  agenda: 'Agenda',
  financeiro: 'Financeiro',
  equipe: 'Equipe',
  relatorios: 'Relatórios',
  mapa: 'Mapa',
  blog: 'Blog',
  notificacoes: 'Notificações',
  configuracoes: 'Configurações',
  novo: 'Novo',
}

function Breadcrumb() {
  const pathname = usePathname() ?? '/admin'
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/')
    const label = ROUTE_LABELS[seg] ?? seg
    const isLast = idx === segments.length - 1
    return { href, label, isLast }
  })

  if (crumbs.length <= 1) return null

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      <Link href="/admin" className="text-slate-400 transition hover:text-primary">
        <Home className="size-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="size-3.5 text-slate-300" />
          {crumb.isLast ? (
            <span className="text-xs font-medium text-slate-700">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-xs font-medium text-slate-400 transition hover:text-primary">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

export function AdminTopbar() {
  const pathname = usePathname() ?? '/admin'
  const { papel } = usePermissions()

  const segments = pathname.split('/').filter(Boolean)
  const currentSeg = segments[segments.length - 1] ?? 'admin'
  const currentLabel = ROUTE_LABELS[currentSeg] ?? currentSeg

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    gerente: 'Gerente',
    corretor: 'Corretor',
    captador: 'Captador',
    financeiro: 'Financeiro',
    atendente: 'Atendente',
    master: 'Master',
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm lg:px-6">
      {/* Page title + breadcrumb */}
      <div className="min-w-0 flex-1">
        <h1 className="text-base font-bold text-slate-800 sm:text-[1.05rem]">
          {currentLabel}
        </h1>
        <Breadcrumb />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* User pill */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 shadow-sm">
          <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[0.68rem] font-bold text-primary">
            {papel ? papel.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[0.75rem] font-semibold text-slate-700">
              {papel ? roleLabel[papel] ?? papel : 'Usuário'}
            </p>
            <p className="text-[0.6rem] text-slate-400">Conta admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
