import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contato',
}

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-primary">Contato</h1>
      <p className="mt-4 text-muted">
        Entre em contato pelo WhatsApp ou e-mail informados no rodapé, ou deixe
        uma mensagem através dos imóveis no catálogo.
      </p>
    </div>
  )
}
