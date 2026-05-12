'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { PURPOSES, PROPERTY_TYPES } from '@/lib/constants'
import type { PropertyPurpose, PropertyType } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const purposeOptions = PURPOSES.map((p) => ({ value: p.value, label: p.label }))
const typeOptions = [
  { value: '', label: 'Qualquer tipo' },
  ...PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label })),
]

export function HeroSection() {
  const router = useRouter()
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [purpose, setPurpose] = useState<PropertyPurpose | ''>('')
  const [type, setType] = useState<PropertyType | ''>('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (neighborhood.trim()) params.set('neighborhood', neighborhood.trim())
    if (purpose) params.set('purpose', purpose)
    if (type) params.set('type', type)
    const q = params.toString()
    router.push(q ? `/imoveis?${q}` : '/imoveis')
  }

  return (
    <section className="relative flex min-h-[min(100vh,720px)] items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600596542815-ffad4b1530a9?auto=format&fit=crop&w=2000&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary/70" />
      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Venda & aluguel
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          Encontre o imóvel perfeito para você
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
          Explore anúncios selecionados, filtros inteligentes e atendimento que
          coloca você no centro.
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-10 rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-white"
            />
            <Input
              placeholder="Bairro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="bg-white"
            />
            <Select
              options={[{ value: '', label: 'Venda ou aluguel' }, ...purposeOptions]}
              value={purpose}
              onChange={(e) =>
                setPurpose((e.target.value || '') as PropertyPurpose | '')
              }
              className="bg-white"
            />
            <Select
              options={typeOptions}
              value={type}
              onChange={(e) => setType((e.target.value || '') as PropertyType | '')}
              className="bg-white"
            />
          </div>
          <div className="mt-4 flex justify-center">
            <Button type="submit" variant="accent" size="lg" className="min-w-[200px] gap-2">
              <Search className="size-5" />
              Buscar imóveis
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
