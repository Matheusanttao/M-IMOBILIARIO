import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFeaturedProperties } from '@/services/properties'
import type { PropertyRow } from '@/types'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import { Spinner } from '@/components/ui/Spinner'
export function FeaturedProperties() {
  const [items, setItems] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchFeaturedProperties(6)
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
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
              Imóveis em destaque
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Seleção especial de imóveis em evidência nesta temporada.
            </p>
          </div>
          <Link
            to="/imoveis"
            className="inline-flex items-center justify-center rounded-xl border-2 border-primary/20 bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition hover:border-accent hover:text-accent"
          >
            Ver todos
          </Link>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <p className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </p>
          ) : (
            <PropertyGrid items={items} />
          )}
        </div>
      </div>
    </section>
  )
}
