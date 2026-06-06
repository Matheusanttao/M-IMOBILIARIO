'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

interface Plano {
  id: string
  nome: string
  preco: number
  descricao: string | null
  recursos: string[] | null
  destaque: boolean
}

export function PlanCard({ plano }: { plano: Plano }) {
  const recursos = plano.recursos ?? []
  const contatoHref = `/contato?plano=${encodeURIComponent(plano.nome)}`

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 ${
        plano.destaque
          ? 'border-accent bg-gradient-to-b from-accent/15 to-card'
          : 'border-white/10 bg-card'
      }`}
    >
      {plano.destaque && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold text-background">
          Mais popular
        </span>
      )}

      <h3 className="font-display text-xl font-bold text-white">{plano.nome}</h3>

      {plano.descricao && (
        <p className="mt-2 text-sm text-white/60">{plano.descricao}</p>
      )}

      <div className="mt-6">
        <span className="font-display text-4xl font-bold text-white">
          R$ {plano.preco.toFixed(2).replace('.', ',')}
        </span>
        <span className="text-sm text-white/50">/mês</span>
      </div>

      {recursos.length > 0 && (
        <ul className="mt-6 flex-1 space-y-3">
          {recursos.map((recurso, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>{recurso}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link
          href={contatoHref}
          className={`inline-flex w-full items-center justify-center rounded-xl px-8 py-3 text-base font-semibold transition-all duration-200 ${
            plano.destaque
              ? 'bg-accent text-primary shadow-md hover:bg-accent-hover hover:shadow-lg'
              : 'bg-primary text-white shadow-md hover:bg-primary-hover hover:shadow-lg'
          }`}
        >
          Falar com consultor
        </Link>
      </div>
    </div>
  )
}
