'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, Search } from 'lucide-react'
import { PROPERTY_TYPES } from '@/lib/constants'
import type { PropertyType } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const typeOptions = [
  { value: '', label: 'Todos os tipos' },
  ...PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label })),
]

const priceOptions = [
  { value: '', label: 'R$ 0' },
  { value: '500000', label: 'R$ 500.000' },
  { value: '1000000', label: 'R$ 1.000.000' },
  { value: '2500000', label: 'R$ 2.500.000' },
  { value: '5000000', label: 'R$ 5.000.000+' },
]

export function HeroSection() {
  const router = useRouter()
  const [location, setLocation] = useState('')
  const [type, setType] = useState<PropertyType | ''>('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (location.trim()) params.set('city', location.trim())
    if (type) params.set('type', type)
    if (priceMin) params.set('priceMin', priceMin)
    if (priceMax) params.set('priceMax', priceMax)
    const q = params.toString()
    router.push(q ? `/imoveis?${q}` : '/imoveis')
  }

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,168,83,0.16),transparent_32%),linear-gradient(180deg,rgba(7,17,31,0)_0%,#07111f_88%)]" />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2200&q=85')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
        <div className="grid min-h-[560px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-accent">
              Encontre o lugar
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Onde seus sonhos moram.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/78">
              Imóveis selecionados com excelência para realizar os melhores
              negócios e viver momentos inesquecíveis.
            </p>
            <Link
              href="/imoveis"
              className="mt-8 inline-flex items-center justify-center rounded-md bg-accent px-8 py-3 text-sm font-semibold text-background shadow-lg shadow-accent/20 transition hover:bg-accent-hover"
            >
              Ver imóveis
            </Link>
          </div>

          <div className="relative hidden min-h-[440px] lg:block">
            <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-card shadow-2xl shadow-black/40" />
            <div
              className="absolute inset-3 rounded-[1.6rem] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85')",
              }}
            />
            <div className="absolute inset-3 rounded-[1.6rem] bg-gradient-to-r from-background/35 via-transparent to-transparent" />
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative z-10 -mt-4 rounded-2xl border border-white/10 bg-[#07101d]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl lg:-mt-16"
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_0.9fr_0.9fr_auto]">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <MapPin className="size-5 shrink-0 text-white" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-white/70">
                  Cidade, bairro ou região
                </span>
                <Input
                  aria-label="Cidade, bairro ou região"
                  placeholder="Ex.: São Paulo, Alphaville..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-0 border-0 bg-transparent p-0 text-sm text-white shadow-none placeholder:text-white/45 focus:border-transparent focus:ring-0"
                />
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <Building2 className="size-5 shrink-0 text-white" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-white/70">
                  Tipo de imóvel
                </span>
                <Select
                  aria-label="Tipo de imóvel"
                  options={typeOptions}
                  value={type}
                  onChange={(e) => setType((e.target.value || '') as PropertyType | '')}
                  className="mt-0 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:border-transparent focus:ring-0 [&>option]:bg-background [&>option]:text-white"
                />
              </span>
            </label>
            <label className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="block text-xs font-medium text-white/70">
                Valor mínimo
              </span>
              <Select
                aria-label="Valor mínimo"
                options={priceOptions}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="mt-1 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:border-transparent focus:ring-0 [&>option]:bg-background [&>option]:text-white"
              />
            </label>
            <label className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="block text-xs font-medium text-white/70">
                Valor máximo
              </span>
              <Select
                aria-label="Valor máximo"
                options={[
                  { value: '', label: 'R$ 5.000.000+' },
                  ...priceOptions.slice(1, -1),
                ]}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="mt-1 border-0 bg-transparent p-0 text-sm text-white shadow-none focus:border-transparent focus:ring-0 [&>option]:bg-background [&>option]:text-white"
              />
            </label>
            <Button
              type="submit"
              variant="accent"
              size="lg"
              className="h-full min-h-14 rounded-xl px-8 text-sm font-semibold"
            >
              <Search className="size-5" />
              Buscar imóveis
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
