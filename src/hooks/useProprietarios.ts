'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchProprietarios } from '@/services/proprietarios'
import type { ProprietarioRow } from '@/types'

export function useProprietarios(filters?: { search?: string; ativo?: boolean | null }) {
  const [rows, setRows] = useState<ProprietarioRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 20

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchProprietarios({
        search: filters?.search,
        ativo: filters?.ativo,
        page,
        pageSize,
      })
      setRows(res.rows)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [filters?.search, filters?.ativo, page])

  useEffect(() => {
    void reload()
  }, [reload])

  return { rows, total, page, setPage, loading, error, reload }
}
