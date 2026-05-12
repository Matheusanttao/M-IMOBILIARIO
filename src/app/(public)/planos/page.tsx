import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PlanCard } from './PlanCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Planos | M-Imobiliário',
  description: 'Escolha o plano ideal para sua imobiliária',
}

interface Plano {
  id: string
  nome: string
  preco: number
  descricao: string | null
  recursos: string[] | null
  destaque: boolean
}

export default async function PlanosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: planos } = await supabase
    .from('planos')
    .select('id, nome, preco, descricao, recursos, destaque')
    .eq('ativo', true)
    .order('preco', { ascending: true })

  const plans: Plano[] = planos ?? []

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-bold text-primary sm:text-5xl">
          Planos e Preços
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Escolha o plano ideal para sua imobiliária. Todos incluem site
          profissional, painel administrativo e suporte.
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-muted">
          Nenhum plano disponível no momento.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plano) => (
            <PlanCard key={plano.id} plano={plano} />
          ))}
        </div>
      )}
    </section>
  )
}
