import Link from 'next/link'
import { HeroSection } from '@/components/home/HeroSection'
import { FeaturedProperties } from '@/components/home/FeaturedProperties'
import { FeaturesSection } from '@/components/home/FeaturesSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProperties />
      <FeaturesSection />
      <section className="bg-background py-16 text-center text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Atendimento exclusivo
          </p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Pronto para dar o próximo passo?
          </h2>
          <p className="mt-4 text-white/85">
            Fale com nossa equipe ou explore o catálogo completo de imóveis.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/imoveis"
              className="inline-flex items-center justify-center rounded-md bg-accent px-8 py-3 text-base font-semibold text-background shadow-lg shadow-accent/20 transition hover:bg-accent-hover"
            >
              Explorar imóveis
            </Link>
            <Link
              href="/contato"
              className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-8 py-3 text-base font-medium text-white transition hover:border-accent hover:text-accent"
            >
              Fale conosco
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
