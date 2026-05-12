'use client'

import Link from 'next/link'
import { X } from 'lucide-react'

const links = [
  { href: '/', label: 'Início' },
  { href: '/imoveis', label: 'Imóveis' },
  { href: '/admin/login', label: 'Área admin' },
]

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white p-6 shadow-xl">
        <div className="mb-8 flex justify-end">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="size-6" />
          </button>
        </div>
        <nav className="flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-lg font-medium text-primary hover:bg-surface"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
