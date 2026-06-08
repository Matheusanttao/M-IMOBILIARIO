'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import type { PropertyListFilters, PropertyPurpose, PropertySort, PropertyType } from '@/types'
import { useImoveis, useTotalPages } from '@/hooks/useImoveis'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import { PropertyFilters } from '@/components/property/PropertyFilters'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { PAGE_SIZE } from '@/lib/constants'
import { useTenant } from '@/contexts/TenantContext'

function parseFilters(searchParams: URLSearchParams): PropertyListFilters {
  const purpose = searchParams.get('purpose') as PropertyPurpose | null
  const type = searchParams.get('type') as PropertyType | null
  return {
    purpose: purpose && (purpose === 'venda' || purpose === 'aluguel') ? purpose : '',
    type:
      type &&
      ['casa', 'apartamento', 'terreno', 'sala_comercial'].includes(type)
        ? type
        : '',
    city: searchParams.get('city') ?? '',
    neighborhood: searchParams.get('neighborhood') ?? '',
    priceMin: searchParams.get('priceMin')
      ? Number(searchParams.get('priceMin'))
      : undefined,
    priceMax: searchParams.get('priceMax')
      ? Number(searchParams.get('priceMax'))
      : undefined,
    bedrooms: searchParams.get('bedrooms')
      ? Number(searchParams.get('bedrooms'))
      : undefined,
    suites: searchParams.get('suites')
      ? Number(searchParams.get('suites'))
      : undefined,
    bathrooms: searchParams.get('bathrooms')
      ? Number(searchParams.get('bathrooms'))
      : undefined,
    parking_spaces: searchParams.get('parking_spaces')
      ? Number(searchParams.get('parking_spaces'))
      : undefined,
  }
}

function filtersToParams(f: PropertyListFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.purpose) p.set('purpose', f.purpose)
  if (f.type) p.set('type', f.type)
  if (f.city?.trim()) p.set('city', f.city.trim())
  if (f.neighborhood?.trim()) p.set('neighborhood', f.neighborhood.trim())
  if (f.priceMin != null && !Number.isNaN(f.priceMin)) p.set('priceMin', String(f.priceMin))
  if (f.priceMax != null && !Number.isNaN(f.priceMax)) p.set('priceMax', String(f.priceMax))
  if (f.bedrooms) p.set('bedrooms', String(f.bedrooms))
  if (f.suites) p.set('suites', String(f.suites))
  if (f.bathrooms) p.set('bathrooms', String(f.bathrooms))
  if (f.parking_spaces) p.set('parking_spaces', String(f.parking_spaces))
  return p
}

export function ImoveisListing() {
  const { empresaId } = useTenant()
  const searchParamsHook = useSearchParams()
  const searchParams = useMemo(
    () => searchParamsHook ?? new URLSearchParams(),
    [searchParamsHook],
  )
  const router = useRouter()
  const pathname = usePathname() ?? '/imoveis'
  const [filters, setFilters] = useState<PropertyListFilters>(() =>
    parseFilters(searchParamsHook ?? new URLSearchParams()),
  )
  const [sort, setSort] = useState<PropertySort>('recent')
  const [mobileFilters, setMobileFilters] = useState(false)

  useEffect(() => {
    setFilters(parseFilters(searchParams))
  }, [searchParams])

  const commitFilters = useCallback(
    (next: PropertyListFilters) => {
      setFilters(next)
      const qs = filtersToParams(next).toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname],
  )

  const { imoveis, total, loading, error, page, setPage } = useImoveis(
    empresaId,
    filters,
    sort,
  )
  const totalPages = useTotalPages(total)

  const sortOptions = useMemo(
    () => [
      { value: 'recent', label: 'Mais recentes' },
      { value: 'price_asc', label: 'Menor preço' },
      { value: 'price_desc', label: 'Maior preço' },
    ],
    [],
  )

  if (!empresaId) {
    return (
      <div className="min-h-screen bg-background py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              Catálogo
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Imóveis
            </h1>
            <p className="mt-2 text-white/60">
              Nosso catálogo estará disponível em breve.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">
            Nenhum imóvel disponível no momento.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
              Catálogo
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Imóveis
            </h1>
            <p className="mt-2 text-white/60">
              {loading ? 'Carregando…' : `${total} resultado(s) encontrados`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileFilters(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filtros
            </Button>
            <div className="min-w-[200px] [&_label]:!text-white/70">
              <Select
                label="Ordenar"
                options={sortOptions}
                value={sort}
                onChange={(e) => setSort(e.target.value as PropertySort)}
                className="border-white/10 bg-card text-white shadow-none focus:ring-accent/30 [&>option]:bg-card [&>option]:text-white"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <PropertyFilters
            value={filters}
            onChange={setFilters}
            onApply={() => {
              commitFilters(filters)
              setMobileFilters(false)
            }}
            mobileOpen={mobileFilters}
            onMobileClose={() => setMobileFilters(false)}
          />

          <div>
            {error ? (
              <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">{error}</p>
            ) : loading ? (
              <div className="flex justify-center py-24">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <PropertyGrid items={imoveis} />
                {totalPages > 1 ? (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="px-3 text-sm text-white/60">
                      Página {page} de {totalPages} ({PAGE_SIZE} por página)
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
