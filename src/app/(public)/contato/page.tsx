import type { Metadata } from 'next'
import { ContatoForm } from '@/components/public/ContatoForm'

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Entre em contato conosco. Envie sua mensagem ou fale pelo WhatsApp.',
}

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
        Fale conosco
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">Contato</h1>
      <p className="mt-2 max-w-xl text-white/60">
        Preencha o formulário abaixo ou entre em contato diretamente pelos nossos canais.
      </p>

      <div className="mt-10">
        <ContatoForm />
      </div>
    </div>
  )
}
