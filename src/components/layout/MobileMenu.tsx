'use client'

import Link from 'next/link'
import { Phone, X } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'

const links = [
  { href: '/', label: 'Início' },
  { href: '/imoveis', label: 'Imóveis' },
  { href: '/imoveis', label: 'Lançamentos' },
  { href: '/sobre', label: 'Sobre nós' },
  { href: '/blog', label: 'Blog' },
  { href: '/contato', label: 'Contato' },
]

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { empresaNome, logoUrl, whatsapp, financiamentoUrl } = useTenant()
  const initials = empresaNome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'I'
  const phoneDigits = whatsapp?.replace(/\D/g, '')

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[min(100%,22rem)] flex-col border-l border-white/10 bg-background p-6 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-3 text-white">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`Logo ${empresaNome}`}
                width={100}
                height={100}
                className="size-[100px] rounded-2xl object-contain"
              />
            ) : (
              <span className="flex size-[100px] items-center justify-center rounded-2xl border border-accent/45 font-display text-3xl font-bold leading-none text-accent">
                {initials.slice(0, 2)}
              </span>
            )}
            <span className="leading-none">
              <span className="block font-display text-xl font-semibold uppercase tracking-[0.2em]">
                {empresaNome}
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="size-6" />
          </button>
        </div>
        <nav className="flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={`${l.href}-${l.label}`}
              href={l.href}
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-lg font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          {financiamentoUrl ? (
            <a
              href={financiamentoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-lg font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              Financiamento
            </a>
          ) : null}
        </nav>
        <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
          {phoneDigits ? (
            <a
              href={`tel:+${phoneDigits}`}
              className="flex items-center gap-2 text-sm font-medium text-white/75"
            >
              <Phone className="size-4 text-accent" />
              WhatsApp
            </a>
          ) : null}
          <Link
            href="/contato"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-semibold text-background transition hover:bg-accent-hover"
          >
            Fale conosco
          </Link>
        </div>
      </div>
    </div>
  )
}
