import { useEffect, useState } from 'react'
import { fetchImovelBySlug } from '@/services/imoveis'
import type { ImovelRow } from '@/types'

export function useImovel(empresaId: string, slug: string | undefined) {
  const [imovel, setImovel] = useState<ImovelRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!empresaId || !slug) {
      setImovel(null)
      setLoading(false)
      setError('Imóvel não encontrado.')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchImovelBySlug(empresaId, slug)
      .then((p) => {
        if (cancelled) return
        setImovel(p)
        if (!p) setError('Imóvel não encontrado ou indisponível.')
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message ?? 'Erro ao carregar.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [empresaId, slug])

  return { imovel, loading, error }
}
