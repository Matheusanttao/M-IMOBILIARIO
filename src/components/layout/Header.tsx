import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileMenu } from '@/components/layout/MobileMenu'

const nav = [
  { to: '/', label: 'Início' },
  { to: '/imoveis', label: 'Imóveis' },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-semibold tracking-tight text-primary sm:text-2xl">
              M<span className="text-accent">.</span> Imobiliário
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors hover:text-accent',
                    isActive ? 'text-primary' : 'text-slate-600',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/admin/login"
              className="inline-flex items-center justify-center rounded-xl border-2 border-primary/20 bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:border-accent hover:text-accent"
            >
              Área admin
            </Link>
            <Link
              to="/imoveis"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-primary-hover hover:shadow-lg"
            >
              Ver imóveis
            </Link>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-primary md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-6" />
          </button>
        </div>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  )
}
