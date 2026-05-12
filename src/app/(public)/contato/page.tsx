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
      <h1 className="font-display text-3xl font-bold text-primary">Contato</h1>
      <p className="mt-2 max-w-xl text-muted">
        Preencha o formulário abaixo ou entre em contato diretamente pelos nossos canais.
      </p>

      <div className="mt-10">
        <ContatoForm />
      </div>
    </div>
  )
}
