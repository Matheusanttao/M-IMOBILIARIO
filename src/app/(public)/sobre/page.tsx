'use client'

import { useTenant } from '@/contexts/TenantContext'

export default function SobrePage() {
  const {
    empresaNome,
    quemSomosTitulo,
    quemSomosTexto,
    quemSomosImagemUrl,
  } = useTenant()
  const title = quemSomosTitulo?.trim() || 'Sobre nós'
  const text =
    quemSomosTexto?.trim() ||
    'Conteúdo em atualização.'

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        {empresaNome}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">{title}</h1>
      {quemSomosImagemUrl ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-card">
          <img
            src={quemSomosImagemUrl}
            alt={title}
            className="max-h-[560px] w-full object-contain"
          />
        </div>
      ) : null}
      <div className="mt-4 space-y-4 leading-relaxed text-white/65">
        {text.split(/\n{2,}/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}
