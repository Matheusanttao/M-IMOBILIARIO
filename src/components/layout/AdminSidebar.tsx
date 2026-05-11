import { NavLink } from 'react-router-dom'
import { Building2, Home, LogOut, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

const items = [
  { to: '/admin', label: 'Dashboard', icon: Home, end: true },
  { to: '/admin/imoveis/novo', label: 'Novo imóvel', icon: Building2 },
  { to: '/admin/leads', label: 'Leads', icon: MessageSquare },
]

export function AdminSidebar() {
  const { signOut } = useAuth()

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2 p-4 lg:flex-col lg:items-stretch">
        <NavLink
          to="/admin"
          className="font-display text-lg font-semibold text-primary lg:mb-6 lg:text-xl"
        >
          Painel
        </NavLink>
        <nav className="flex flex-1 flex-wrap gap-1 lg:flex-col">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 hover:bg-surface',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 lg:w-full">
          <NavLink
            to="/"
            className="text-center text-sm text-slate-500 hover:text-primary lg:text-left"
          >
            Ver site
          </NavLink>
          <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={() => signOut()}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  )
}
