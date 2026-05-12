'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import type { ImovelRow } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/contexts/TenantContext'

const STORAGE_KEY = 'mimob_compare_ids'

export default function CompararPage() {
  const { empresaId } = useTenant()
  const [items, setItems] = useState<ImovelRow[]>([])

  useEffect(() => {
    if (!empresaId || typeof window === 'undefined') return
    const raw = localStorage.getItem(STORAGE_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    if (!ids.length) return
    const supabase = createClient()
    supabase
      .from('imoveis')
      .select('*, imovel_imagens(*)')
      .eq('empresa_id', empresaId)
      .in('id', ids.slice(0, 3))
      .then(({ data }) => setItems((data as ImovelRow[]) ?? []))
  }, [empresaId])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-primary">Comparador</h1>
      <p className="mt-2 text-muted">
        Até 3 imóveis salvos em <code className="rounded bg-slate-100 px-1">localStorage</code>{' '}
        (adicione IDs pelo catálogo em evolução).
      </p>
      <div className="mt-8">
        {items.length ? (
          <PropertyGrid items={items} />
        ) : (
          <p className="text-muted">
            Nada para comparar.{' '}
            <Link href="/imoveis" className="text-primary underline">
              Ver imóveis
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
