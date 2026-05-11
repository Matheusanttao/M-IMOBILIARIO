import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

const links = [
  { to: '/', label: 'Início' },
  { to: '/imoveis', label: 'Imóveis' },
  { to: '/admin/login', label: 'Área admin' },
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
              key={l.to}
              to={l.to}
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
