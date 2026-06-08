'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import type { ImovelRow } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/contexts/TenantContext'

const STORAGE_KEY = 'mimob_fav_ids'

function readStoredIds(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

export default function FavoritosPage() {
  const { empresaId } = useTenant()
  const [items, setItems] = useState<ImovelRow[]>([])

  useEffect(() => {
    if (!empresaId || typeof window === 'undefined') return
    const ids = readStoredIds()
    if (!ids.length) return
    const supabase = createClient()
    supabase
      .from('imoveis')
      .select('*, imovel_imagens(*)')
      .eq('empresa_id', empresaId)
      .in('id', ids)
      .then(({ data }) => setItems((data as ImovelRow[]) ?? []))
  }, [empresaId])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-white">Favoritos</h1>
      <p className="mt-2 text-white/60">Armazenados no navegador (usuário anônimo).</p>
      <div className="mt-8">
        {items.length ? (
          <PropertyGrid items={items} />
        ) : (
          <p className="text-white/60">
            Nenhum favorito. Explore{' '}
            <Link href="/imoveis" className="text-accent underline">
              imóveis
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  )
}
