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
        <div className="mx-auto flex min-h-24 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:min-h-28 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3 text-white">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo ${displayName}`}
                width={260}
                height={110}
                className="h-16 w-auto max-w-[150px] object-contain sm:h-20 sm:max-w-[190px] xl:h-24 xl:max-w-[230px]"
              />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-accent/45 font-display text-2xl font-bold leading-none text-accent sm:size-20 sm:text-3xl">
                {initials.slice(0, 2)}
              </span>
            )}
            <span className={cn('min-w-0 leading-none', logoUrl && 'hidden 2xl:block')}>
              <span className="block max-w-[220px] truncate font-display text-lg font-semibold uppercase tracking-[0.16em] text-white 2xl:text-xl">
                {displayName}
              </span>
            </span>
          </Link>

          <nav className="hidden min-w-0 items-center gap-5 xl:flex">
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

          <div className="hidden shrink-0 items-center gap-4 xl:flex">
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
            className="shrink-0 rounded-lg p-2 text-white xl:hidden"
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
