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
    <section className="border-y border-white/10 bg-[#091625] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Experiência premium
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Por que usar a plataforma?
          </h2>
          <p className="mt-3 text-white/60">
            Experiência pensada para quem busca um novo lar ou um bom investimento.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-white/10 bg-card shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:bg-card-hover hover:shadow-2xl hover:shadow-black/20"
            >
              <CardContent className="pt-8">
                <div className="mb-4 inline-flex rounded-xl bg-accent/15 p-3 text-accent">
                  <f.icon className="size-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/58">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
