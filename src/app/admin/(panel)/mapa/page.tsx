'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MapaImoveis } from '@/components/mapa/MapaImoveis'
import type { ImovelRow } from '@/types'

export default function AdminMapaPage() {
  const supabase = useMemo(() => createClient(), [])
  const [imoveis, setImoveis] = useState<ImovelRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('imoveis')
        .select('id, titulo, latitude, longitude, slug')
        .limit(200)
      if (!cancelled) {
        setImoveis((data as ImovelRow[]) ?? [])
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [supabase])

  if (loading) return <p className="text-muted">Carregando mapa…</p>

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-primary">Mapa dos imóveis</h1>
      <p className="mt-1 text-muted">Pins com OpenStreetMap (coordenadas do cadastro).</p>
      <div className="mt-8">
        <MapaImoveis imoveis={imoveis} height="520px" />
      </div>
      <p className="mt-4 text-sm text-muted">
        Edite latitude/longitude em{' '}
        <Link href="/admin/imoveis/novo" className="text-primary underline">
          cadastro de imóveis
        </Link>
        .
      </p>
    </div>
  )
}
