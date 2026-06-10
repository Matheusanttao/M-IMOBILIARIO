'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ImovelRow } from '@/types'
import 'leaflet/dist/leaflet.css'

type Props = {
  imoveis: Pick<ImovelRow, 'id' | 'titulo' | 'latitude' | 'longitude' | 'slug'>[]
  height?: string
  emptyState?: ReactNode
}

export function MapaImoveis({ imoveis, height = '420px', emptyState = null }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return
    let cancelled = false

    void import('leaflet').then((L) => {
      if (cancelled || !ref.current) return
      const valid = imoveis.filter((i) => i.latitude != null && i.longitude != null)
      if (!valid.length) return

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const first = valid[0]!
      const map = L.map(ref.current).setView([first.latitude!, first.longitude!], 12)
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      valid.forEach((imovel) => {
        L.marker([imovel.latitude!, imovel.longitude!])
          .addTo(map)
          .bindPopup(`<strong>${imovel.titulo}</strong>`)
      })

      if (valid.length > 1) {
        const b = L.latLngBounds(valid.map((i) => [i.latitude!, i.longitude!] as [number, number]))
        map.fitBounds(b, { padding: [24, 24] })
      }
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [imoveis])

  const hasCoords = imoveis.some((i) => i.latitude != null && i.longitude != null)

  if (!hasCoords) {
    return emptyState
  }

  return <div ref={ref} className="w-full rounded-2xl border border-slate-200 shadow-md" style={{ height }} />
}
