import { useEffect, useState } from 'react'
import { fetchPropertyById } from '@/services/properties'
import type { PropertyRow } from '@/types'

export function useProperty(id: string | undefined) {
  const [property, setProperty] = useState<PropertyRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setProperty(null)
      setLoading(false)
      setError('Imóvel não encontrado.')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPropertyById(id)
      .then((p) => {
        if (cancelled) return
        setProperty(p)
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
  }, [id])

  return { property, loading, error }
}
