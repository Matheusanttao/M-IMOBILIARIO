'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchFeaturedImoveis } from '@/services/imoveis'
import type { ImovelRow } from '@/types'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import { Spinner } from '@/components/ui/Spinner'

export function FeaturedProperties() {
  const [items, setItems] = useState<ImovelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchFeaturedImoveis(6)
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              Imóveis em destaque
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Os melhores imóveis esperando por você.
            </h2>
          </div>
          <Link
            href="/imoveis"
            className="inline-flex items-center justify-center rounded-md border border-white/15 px-6 py-3 text-sm font-medium text-white/85 transition hover:border-accent hover:text-accent"
          >
            Ver todos os imóveis
          </Link>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-center text-sm text-red-200">
              {error}
            </p>
          ) : items.length ? (
            <PropertyGrid items={items} />
          ) : (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
              Nenhum imóvel em destaque no momento.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
