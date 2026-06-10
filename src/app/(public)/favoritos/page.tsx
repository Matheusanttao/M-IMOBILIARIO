'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PropertyGrid } from '@/components/property/PropertyGrid'
import type { ImovelRow } from '@/types'
import { fetchFavoriteProperties } from '@/services/favoritos'

export default function FavoritosPage() {
  const [items, setItems] = useState<ImovelRow[]>([])
  const [source, setSource] = useState<'database' | 'local'>('local')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchFavoriteProperties()
      .then(({ items: favoriteItems, source: favoriteSource }) => {
        if (cancelled) return
        setItems(favoriteItems)
        setSource(favoriteSource)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-white">Favoritos</h1>
      <p className="mt-2 text-white/60">
        {source === 'database'
          ? 'Sincronizados com sua conta.'
          : 'Armazenados neste navegador para visitantes anônimos.'}
      </p>
      <div className="mt-8">
        {loading ? (
          <p className="text-white/60">Carregando favoritos...</p>
        ) : items.length ? (
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
