import { useCallback, useEffect, useState } from 'react'
import { fetchLeadsForTenant } from '@/services/leads'
import type { LeadRow } from '@/types'

type LeadWithImovel = LeadRow & {
  imoveis?: { titulo: string; id: string; slug: string | null } | null
}

export function useLeads() {
  const [leads, setLeads] = useState<LeadWithImovel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchLeadsForTenant()
      .then(setLeads)
      .catch((e: Error) => setError(e.message ?? 'Erro ao carregar leads.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { leads, loading, error, reload: load }
}
