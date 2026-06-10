'use client'

import Link from 'next/link'
import { Bath, Bed, Car, Heart, MapPin, Maximize2 } from 'lucide-react'
import type { ImovelRow } from '@/types'
import { PROPERTY_TYPE_LABELS } from '@/lib/constants'
import { cn, formatCurrencyBRL } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

const PLACEHOLDER_IMAGE = '/placeholder-imovel.jpg'

export function PropertyCard({
  property,
  className,
}: {
  property: ImovelRow
  className?: string
}) {
  const href = `/imoveis/${property.slug ?? property.id}`
  const img =
    property.imovel_imagens?.find((image) => image.is_capa)?.url ||
    property.imovel_imagens?.[0]?.url ||
    PLACEHOLDER_IMAGE
  const label = property.finalidade === 'aluguel' ? 'OPORTUNIDADE' : 'DESTAQUE'

  return (
    <Link
      href={href}
      className={cn(
        'group block h-full overflow-hidden rounded-2xl border border-white/10 bg-card shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:bg-card-hover hover:shadow-2xl hover:shadow-black/30',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={img}
          alt={property.titulo}
          onError={(e) => {
            const target = e.currentTarget
            if (target.src.endsWith(PLACEHOLDER_IMAGE)) return
            target.src = PLACEHOLDER_IMAGE
          }}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        <Badge
          variant="accent"
          className="absolute left-3 top-3 rounded-md border-0 bg-accent px-3 py-1 text-[0.62rem] font-bold text-background"
        >
          {label}
        </Badge>
        <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur transition group-hover:border-accent group-hover:text-accent">
          <Heart className="size-5" />
        </span>
      </div>

      <div className="flex min-h-[12rem] flex-col p-4">
        <p className="font-display text-base font-semibold text-white transition group-hover:text-accent">
          {property.titulo}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/58">
          <MapPin className="size-3.5 shrink-0" />
          {property.bairro}, {property.cidade}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5 text-xs text-white/70">
          <span className="flex items-center gap-1">
            <Bed className="size-3.5" />
            {property.quartos}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {property.banheiros}
          </span>
          <span className="flex items-center gap-1">
            <Car className="size-3.5" />
            {property.vagas}
          </span>
          {property.area != null ? (
            <span className="flex items-center gap-1">
              <Maximize2 className="size-3.5" />
              {property.area}m²
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-white/45">
            {PROPERTY_TYPE_LABELS[property.tipo]}
          </span>
          <span className="font-display text-sm font-bold text-white">
            {formatCurrencyBRL(property.preco)}
          </span>
        </div>
      </div>
    </Link>
  )
}
