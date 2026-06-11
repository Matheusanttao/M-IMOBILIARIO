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
  Map,
  Bell,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/hooks/usePermissions'
import type { ModuloRBAC } from '@/lib/rbac'

type NavGroup = {
  label: string
  items: {
    href: string
    label: string
    icon: typeof Home
    modulo: ModuloRBAC
    end?: boolean
  }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/admin', label: 'Dashboard', icon: Home, modulo: 'dashboard', end: true },
    ],
  },
  {
    label: 'Negócios',
    items: [
      { href: '/admin/imoveis', label: 'Imóveis', icon: Building2, modulo: 'imoveis' },
      { href: '/admin/proprietarios', label: 'Clientes', icon: UserCircle, modulo: 'proprietarios' },
      { href: '/admin/leads', label: 'Leads', icon: MessageSquare, modulo: 'crm' },
      { href: '/admin/agenda', label: 'Agenda', icon: Calendar, modulo: 'agenda' },
      { href: '/admin/contratos', label: 'Contratos', icon: FileText, modulo: 'contratos' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet, modulo: 'financeiro' },
      { href: '/admin/equipe', label: 'Equipe', icon: Users, modulo: 'equipe' },
      { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3, modulo: 'relatorios' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/mapa', label: 'Mapa', icon: Map, modulo: 'mapa' },
      { href: '/admin/blog', label: 'Blog', icon: FileText, modulo: 'blog' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/notificacoes', label: 'Notificações', icon: Bell, modulo: 'notificacoes' },
      { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, modulo: 'configuracoes' },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const path = pathname ?? ''
  const { papel, loading, can } = usePermissions()

  async function signOut() {
    const supabase = createClient()
    window.sessionStorage.removeItem('admin_user_role')
    window.localStorage.removeItem('admin_user_role')
    document.cookie = 'tenant_slug=; path=/; max-age=0; samesite=lax'
    await supabase.auth.signOut({ scope: 'global' })
    window.location.replace('/admin/logout')
  }

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#060f1c] text-white lg:h-screen lg:w-60 lg:border-r lg:border-white/[0.06] lg:sticky lg:top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-[18px] border-b border-white/[0.06]">
        <div className="flex size-9 items-center justify-center rounded-xl bg-accent/20 ring-1 ring-accent/40">
          <Building2 className="size-5 text-accent" />
        </div>
        <div className="leading-none">
          <p className="text-[0.82rem] font-bold uppercase tracking-widest text-white">
            M. Imobiliário
          </p>
          <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-white/40">
            Seja bem-vindo
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 lg:space-y-0">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (loading) return true
            return can(item.modulo, 'visualizar')
          })
          if (!visibleItems.length) return null
          return (
            <div key={group.label} className="mb-3">
              <p className="hidden lg:block px-3 pt-2 pb-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-white/30 select-none">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1 lg:flex-col lg:gap-0.5">
                {visibleItems.map(({ href, label, icon: Icon, end }) => {
                  const active = end
                    ? path === href
                    : path === href || path.startsWith(`${href}/`)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.82rem] font-medium transition-all duration-150',
                        active
                          ? 'bg-accent/15 text-accent shadow-sm ring-1 ring-accent/20'
                          : 'text-white/50 hover:bg-white/[0.06] hover:text-white/90',
                      )}
                    >
                      <Icon className={cn('size-4 shrink-0 transition-colors', active ? 'text-accent' : 'text-white/40 group-hover:text-white/70')} />
                      <span className="hidden lg:block flex-1">{label}</span>
                      {active && (
                        <ChevronRight className="hidden lg:block size-3 text-accent/60" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent/20 text-[0.72rem] font-bold text-accent ring-1 ring-accent/30">
            {papel ? papel.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden lg:block min-w-0 flex-1">
            <p className="truncate text-[0.78rem] font-semibold text-white/80">
              {papel ? papel.charAt(0).toUpperCase() + papel.slice(1) : 'Usuário'}
            </p>
            <p className="text-[0.65rem] text-white/35">Conta administrativa</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            title="Sair"
            className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
