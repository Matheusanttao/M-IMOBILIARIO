import { useCallback, useEffect, useState } from 'react'
import { fetchLeadsForUser } from '@/services/leads'
import type { LeadRow } from '@/types'

type LeadWithProperty = LeadRow & {
  properties?: { title: string; id: string } | null
}

export function useLeads() {
  const [leads, setLeads] = useState<LeadWithProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchLeadsForUser()
      .then(setLeads)
      .catch((e: Error) => setError(e.message ?? 'Erro ao carregar leads.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { leads, loading, error, reload: load }
}
