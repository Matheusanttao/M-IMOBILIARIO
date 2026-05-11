import { Headphones, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

const features = [
  {
    icon: Sparkles,
    title: 'Curadoria premium',
    text: 'Anúncios organizados com fotos de qualidade e informações completas para decidir com segurança.',
  },
  {
    icon: Headphones,
    title: 'Atendimento ágil',
    text: 'Canal direto por WhatsApp e formulário de interesse para respostas rápidas.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparência',
    text: 'Dados claros sobre localização, metragem e valores — sem surpresas.',
  },
  {
    icon: TrendingUp,
    title: 'Mercado em movimento',
    text: 'Novidades frequentes em venda e aluguel nas melhores regiões.',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-surface py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
            Por que usar a plataforma?
          </h2>
          <p className="mt-3 text-muted">
            Experiência pensada para quem busca um novo lar ou um bom investimento.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-slate-100/80 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <CardContent className="pt-8">
                <div className="mb-4 inline-flex rounded-xl bg-accent/15 p-3 text-primary">
                  <f.icon className="size-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
