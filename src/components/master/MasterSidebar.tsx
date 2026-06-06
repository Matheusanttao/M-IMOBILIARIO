'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  CreditCard,
  FileText,
  Home,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

const items = [
  { href: '/master', label: 'Dashboard', icon: Home, end: true },
  { href: '/master/empresas', label: 'Imobiliárias', icon: Building2 },
  { href: '/master/planos', label: 'Planos', icon: CreditCard },
  { href: '/master/logs', label: 'Logs', icon: FileText },
]

export function MasterSidebar() {
  const pathname = usePathname()
  const path = pathname ?? ''

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <aside className="flex w-full flex-col border-b border-slate-800 bg-slate-950 text-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex flex-col gap-2 p-4 lg:min-h-screen">
        <span className="mb-4 font-display text-lg font-semibold text-accent">
          Master SaaS
        </span>
        <nav className="flex flex-1 flex-col gap-1">
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
                  active ? 'bg-accent text-primary' : 'text-slate-300 hover:bg-slate-800',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          className="mt-8 justify-start gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={() => signOut()}
        >
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
