'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AcaoRBAC, ModuloRBAC, Papel } from '@/lib/rbac'
import { papelTemAcao } from '@/lib/rbac'

const ROLE_CACHE_KEY = 'admin_user_role'
let cachedPapel: Papel | null = null

type PermissionOverrideMap = Partial<Record<ModuloRBAC, Partial<Record<AcaoRBAC, boolean>>>>

interface PermissionProfile {
  papel: Papel | null
  overrides: PermissionOverrideMap
}

function getCachedPapel(): Papel | null {
  if (cachedPapel) return cachedPapel
  if (typeof window === 'undefined') return null
  cachedPapel = window.sessionStorage.getItem(ROLE_CACHE_KEY) as Papel | null
  return cachedPapel
}

async function fetchPermissionProfile(): Promise<PermissionProfile> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { papel: null, overrides: {} }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('role, empresa_id')
    .eq('id', user.id)
    .maybeSingle()

  const papel = (usuario?.role as Papel) ?? null
  cachedPapel = papel
  if (typeof window !== 'undefined') {
    if (papel) window.sessionStorage.setItem(ROLE_CACHE_KEY, papel)
    else window.sessionStorage.removeItem(ROLE_CACHE_KEY)
  }

  if (!papel || !usuario?.empresa_id) return { papel, overrides: {} }

  const { data: rows } = await supabase
    .from('permissoes')
    .select('modulo, acao, permitido')
    .eq('empresa_id', usuario.empresa_id)
    .eq('papel', papel)

  const overrides: PermissionOverrideMap = {}
  for (const row of rows ?? []) {
    const modulo = row.modulo as ModuloRBAC
    const acao = row.acao as AcaoRBAC
    overrides[modulo] = {
      ...(overrides[modulo] ?? {}),
      [acao]: Boolean(row.permitido),
    }
  }

  return { papel, overrides }
}

export function usePermissions() {
  const [papel, setPapel] = useState<Papel | null>(() => getCachedPapel())
  const [loading, setLoading] = useState(() => !getCachedPapel())
  const [overrides, setOverrides] = useState<PermissionOverrideMap>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      const nextProfile = await fetchPermissionProfile()
      if (!cancelled) {
        setPapel(nextProfile.papel)
        setOverrides(nextProfile.overrides)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const can = useCallback(
    (modulo: ModuloRBAC, acao: AcaoRBAC) => {
      const override = overrides[modulo]?.[acao]
      if (override !== undefined) return override
      return papelTemAcao(papel, modulo, acao)
    },
    [overrides, papel],
  )

  return { papel, loading, can }
}
