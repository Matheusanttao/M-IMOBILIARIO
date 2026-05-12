import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre nós',
}

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-primary">Sobre nós</h1>
      <p className="mt-4 leading-relaxed text-muted">
        Somos uma imobiliária focada em experiência digital, transparência e
        atendimento consultivo. Esta página pode ser personalizada no painel em
        breve.
      </p>
    </div>
  )
}
