'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { useTenant } from '@/contexts/TenantContext'

const nav = [
  { href: '/', label: 'Início' },
  { href: '/imoveis', label: 'Imóveis' },
  { href: '/imoveis', label: 'Lançamentos' },
  { href: '/sobre', label: 'Sobre nós' },
  { href: '/blog', label: 'Blog' },
  { href: '/contato', label: 'Contato' },
]

export function Header() {
  const pathname = usePathname()
  const path = pathname ?? ''
  const [open, setOpen] = useState(false)
  const { empresaNome, logoUrl, whatsapp, financiamentoLinks } = useTenant()
  const initials = empresaNome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'I'
  const displayName = empresaNome || 'Imobiliária'
  const phoneDigits = whatsapp?.replace(/\D/g, '')

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-32 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-white">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo ${displayName}`}
                width={260}
                height={110}
                className="h-24 w-auto max-w-[260px] object-contain sm:h-28"
              />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-2xl border border-accent/45 font-display text-3xl font-bold leading-none text-accent sm:size-28">
                {initials.slice(0, 2)}
              </span>
            )}
            <span className="leading-none">
              <span className="block font-display text-2xl font-semibold uppercase tracking-[0.22em] text-white">
                {displayName}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => {
              const active =
                item.href === '/'
                  ? path === '/'
                  : path === item.href ||
                    path.startsWith(`${item.href}/`)
              return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  'relative py-2 text-sm font-medium text-white/72 transition-colors hover:text-white',
                  active &&
                    'text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-accent',
                )}
              >
                {item.label}
              </Link>
              )
            })}
            {financiamentoLinks.length ? (
              <Link
                href="/financiamento"
                className="relative py-2 text-sm font-medium text-white/72 transition-colors hover:text-white"
              >
                Financiamento
              </Link>
            ) : null}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            {phoneDigits ? (
              <a
                href={`tel:+${phoneDigits}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-accent"
              >
                <Phone className="size-4" />
                WhatsApp
              </a>
            ) : null}
            <Link
              href="/contato"
              className="inline-flex items-center justify-center rounded-md bg-accent px-7 py-3 text-sm font-semibold text-background shadow-lg shadow-accent/20 transition hover:bg-accent-hover"
            >
              Fale conosco
            </Link>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-white lg:hidden"
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
