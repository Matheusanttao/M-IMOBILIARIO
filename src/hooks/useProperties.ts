import { useCallback, useEffect, useState } from 'react'
import { fetchPublicProperties } from '@/services/properties'
import type { PropertyListFilters, PropertyRow, PropertySort } from '@/types'
import { PAGE_SIZE } from '@/lib/constants'

interface UsePropertiesResult {
  properties: PropertyRow[]
  total: number
  loading: boolean
  error: string | null
  page: number
  setPage: (p: number) => void
  refetch: () => void
}

export function useProperties(
  filters: PropertyListFilters,
  sort: PropertySort,
): UsePropertiesResult {
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    setPage(1)
  }, [filters, sort])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPublicProperties({ filters, sort, page })
      .then(({ data, count }) => {
        if (cancelled) return
        setProperties(data)
        setTotal(count ?? data.length)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message ?? 'Erro ao carregar imóveis.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters, sort, page, tick])

  return {
    properties,
    total,
    loading,
    error,
    page,
    setPage,
    refetch,
  }
}

export function useTotalPages(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}
