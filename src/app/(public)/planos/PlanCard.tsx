'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Plano {
  id: string
  nome: string
  preco: number
  descricao: string | null
  recursos: string[] | null
  destaque: boolean
}

export function PlanCard({ plano }: { plano: Plano }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plano_id: plano.id,
          empresa_id: 'new',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao iniciar assinatura')
        return
      }
      if (data.init_point) {
        window.location.href = data.init_point
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const recursos = plano.recursos ?? []

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-lg ${
        plano.destaque
          ? 'border-accent bg-gradient-to-b from-accent/5 to-white shadow-md'
          : 'border-slate-200 bg-white'
      }`}
    >
      {plano.destaque && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold text-primary">
          Mais popular
        </span>
      )}

      <h3 className="font-display text-xl font-bold text-primary">{plano.nome}</h3>

      {plano.descricao && (
        <p className="mt-2 text-sm text-muted">{plano.descricao}</p>
      )}

      <div className="mt-6">
        <span className="font-display text-4xl font-bold text-primary">
          R$ {plano.preco.toFixed(2).replace('.', ',')}
        </span>
        <span className="text-sm text-muted">/mês</span>
      </div>

      {recursos.length > 0 && (
        <ul className="mt-6 flex-1 space-y-3">
          {recursos.map((recurso, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>{recurso}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Button
          variant={plano.destaque ? 'accent' : 'primary'}
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleSubscribe}
        >
          Assinar
        </Button>
        {error && (
          <p className="mt-2 text-center text-xs text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
