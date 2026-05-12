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
import { Button } from '@/components/ui/Button'
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
  { href: '/admin/imoveis/novo', label: 'Novo imóvel', icon: Building2, modulo: 'imoveis' },
  { href: '/admin/leads', label: 'Leads / CRM', icon: MessageSquare, modulo: 'crm' },
  { href: '/admin/proprietarios', label: 'Proprietários', icon: UserCircle, modulo: 'proprietarios' },
  { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet, modulo: 'financeiro' },
  { href: '/admin/contratos', label: 'Propostas & Contratos', icon: FileSignature, modulo: 'contratos' },
  { href: '/admin/mapa', label: 'Mapa', icon: Map, modulo: 'mapa' },
  { href: '/admin/agenda', label: 'Agenda', icon: Calendar, modulo: 'agenda' },
  { href: '/admin/equipe', label: 'Equipe', icon: Users, modulo: 'equipe' },
  { href: '/admin/relatorios', label: 'Relatórios & BI', icon: BarChart3, modulo: 'relatorios' },
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
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2 p-4 lg:flex-col lg:items-stretch">
        <Link
          href="/admin"
          className="font-display text-lg font-semibold text-primary lg:mb-6 lg:text-xl"
        >
          Painel
        </Link>
        <nav className="flex flex-1 flex-wrap gap-1 lg:flex-col">
          {visible.map(({ href, label, icon: Icon, end }) => {
            const active = end
              ? path === href
              : path === href || path.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 hover:bg-surface',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 lg:w-full">
          <Link
            href="/"
            className="text-center text-sm text-slate-500 hover:text-primary lg:text-left"
          >
            Ver site
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  )
}
