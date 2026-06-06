import { createServerSupabaseClient, isServerSupabaseConfigured } from '@/lib/supabase/server'
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
  let plans: Plano[] = []

  if (isServerSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient()
    const { data: planos } = await supabase
      .from('planos')
      .select('id, nome, preco:preco_mensal, descricao, recursos, destaque')
      .eq('ativo', true)
      .order('preco_mensal', { ascending: true })

    plans = planos ?? []
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
          Planos
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
          Planos e Preços
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
          Escolha o plano ideal para sua imobiliária. Todos incluem site
          profissional, painel administrativo e suporte. A contratação é feita
          por atendimento direto com nossa equipe.
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-white/60">
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
