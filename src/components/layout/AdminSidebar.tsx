'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Home,
  LogOut,
  MessageSquare,
  Calendar,
  Users,
  BarChart3,
  FileText,
  Settings,
  UserCircle,
  Wallet,
  FileSignature,
  Map,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/hooks/usePermissions'
import type { ModuloRBAC } from '@/lib/rbac'
import { podeVisualizarModulo } from '@/lib/rbac'

const nav: {
  href: string
  label: string
  icon: typeof Home
  modulo: ModuloRBAC
  end?: boolean
}[] = [
  { href: '/admin', label: 'Dashboard', icon: Home, modulo: 'dashboard', end: true },
  { href: '/admin/imoveis', label: 'Imóveis', icon: Building2, modulo: 'imoveis' },
  { href: '/admin/proprietarios', label: 'Clientes', icon: UserCircle, modulo: 'proprietarios' },
  { href: '/admin/leads', label: 'Leads', icon: MessageSquare, modulo: 'crm' },
  { href: '/admin/agenda', label: 'Agendamentos', icon: Calendar, modulo: 'agenda' },
  { href: '/admin/contratos', label: 'Contratos', icon: FileSignature, modulo: 'contratos' },
  { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet, modulo: 'financeiro' },
  { href: '/admin/mapa', label: 'Mapa', icon: Map, modulo: 'mapa' },
  { href: '/admin/equipe', label: 'Equipe', icon: Users, modulo: 'equipe' },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3, modulo: 'relatorios' },
  { href: '/admin/blog', label: 'Blog', icon: FileText, modulo: 'blog' },
  { href: '/admin/notificacoes', label: 'Notificações', icon: Bell, modulo: 'notificacoes' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, modulo: 'configuracoes' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const path = pathname ?? ''
  const { papel, loading } = usePermissions()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const visible = nav.filter((item) => {
    if (loading) return true
    return podeVisualizarModulo(papel, item.modulo)
  })

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#07111f] text-white lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:sticky lg:top-0">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex size-10 items-center justify-center rounded-full border border-accent/45 font-display text-xl font-bold leading-none text-accent">
          I
        </span>
        <span className="leading-none">
          <span className="block font-display text-lg font-semibold uppercase tracking-[0.2em] text-white">
            Painel
          </span>
          <span className="mt-1 block text-[0.55rem] font-semibold uppercase tracking-[0.38em] text-accent/80">
            Imobiliária
          </span>
        </span>
      </div>

      <nav className="flex flex-1 flex-wrap gap-1 overflow-y-auto px-3 py-4 lg:flex-col lg:flex-nowrap">
        {visible.map(({ href, label, icon: Icon, end }) => {
          const active = end
            ? path === href
            : path === href || path.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-accent text-background shadow-md shadow-accent/20'
                  : 'text-white/65 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="size-[1.15rem] shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-4 px-4 pb-4">
        <div className="flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">Administrador</p>
            <p className="truncate text-xs text-white/50">Administrador</p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            title="Sair"
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
