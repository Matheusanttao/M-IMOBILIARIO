'use client'

import { useTenant } from '@/contexts/TenantContext'

export default function SobrePage() {
  const { empresaNome } = useTenant()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        {empresaNome}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">Sobre nós</h1>
      <p className="mt-4 leading-relaxed text-white/65">
        Somos uma imobiliária focada em experiência digital, transparência e
        atendimento consultivo. Nossa equipe acompanha cada etapa da jornada para
        conectar pessoas aos imóveis certos com segurança e clareza.
      </p>
    </div>
  )
}
