'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Home, LogOut, MessageSquare, Calendar, Users, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

const items = [
  { href: '/admin', label: 'Dashboard', icon: Home, end: true },
  { href: '/admin/imoveis/novo', label: 'Novo imóvel', icon: Building2 },
  { href: '/admin/leads', label: 'Leads', icon: MessageSquare },
  { href: '/admin/agenda', label: 'Agenda', icon: Calendar },
  { href: '/admin/equipe', label: 'Equipe', icon: Users },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const path = pathname ?? ''

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

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
          {items.map(({ href, label, icon: Icon, end }) => {
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
