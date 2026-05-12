import { useCallback, useEffect, useState } from 'react'
import { fetchPublicImoveis } from '@/services/imoveis'
import type { ImovelRow, PropertyListFilters, PropertySort } from '@/types'
import { PAGE_SIZE } from '@/lib/constants'

interface UseImoveisResult {
  imoveis: ImovelRow[]
  total: number
  loading: boolean
  error: string | null
  page: number
  setPage: (p: number) => void
  refetch: () => void
}

export function useImoveis(
  empresaId: string,
  filters: PropertyListFilters,
  sort: PropertySort,
): UseImoveisResult {
  const [imoveis, setImoveis] = useState<ImovelRow[]>([])
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
    if (!empresaId) {
      setImoveis([])
      setTotal(0)
      setLoading(false)
      setError('Imobiliária não encontrada.')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPublicImoveis({ empresaId, filters, sort, page })
      .then(({ data, count }) => {
        if (cancelled) return
        setImoveis(data)
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
  }, [empresaId, filters, sort, page, tick])

  return {
    imoveis,
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
