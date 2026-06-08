'use client'

import { useTenant } from '@/contexts/TenantContext'

export default function FinanciamentoPage() {
  const { empresaNome, financiamentoLinks } = useTenant()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        {empresaNome}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">
        Financiamento
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Escolha uma das opções abaixo para simular ou iniciar seu financiamento.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {financiamentoLinks.length ? (
          financiamentoLinks.map((financiamento) => (
            <a
              key={`${financiamento.titulo}-${financiamento.url}`}
              href={financiamento.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-accent hover:bg-white/[0.06]"
            >
              <span className="block font-display text-xl font-semibold text-white">
                {financiamento.titulo}
              </span>
              <span className="mt-3 inline-flex text-sm font-semibold text-accent">
                Acessar simulação
              </span>
            </a>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60 sm:col-span-2">
            Nenhuma opção de financiamento cadastrada no momento.
          </div>
        )}
      </div>
    </div>
  )
}
