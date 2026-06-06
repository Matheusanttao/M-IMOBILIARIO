'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AcaoRBAC, ModuloRBAC, Papel } from '@/lib/rbac'
import { papelTemAcao } from '@/lib/rbac'

export function usePermissions() {
  const [papel, setPapel] = useState<Papel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) {
        setPapel(null)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setPapel((data?.role as Papel) ?? null)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const can = useCallback(
    (modulo: ModuloRBAC, acao: AcaoRBAC) => papelTemAcao(papel, modulo, acao),
    [papel],
  )

  return { papel, loading, can }
}
