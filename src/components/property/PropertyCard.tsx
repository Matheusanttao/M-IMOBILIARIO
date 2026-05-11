import { Link } from 'react-router-dom'
import { Bath, Bed, Car, MapPin, Maximize2 } from 'lucide-react'
import type { PropertyRow } from '@/types'
import { PURPOSE_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/constants'
import { cn, formatCurrencyBRL, getCoverImage } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

export function PropertyCard({
  property,
  className,
}: {
  property: PropertyRow
  className?: string
}) {
  const img = getCoverImage(property.property_images)
  return (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden border-0 shadow-md ring-1 ring-slate-100/80',
        className,
      )}
    >
      <Link to={`/imoveis/${property.id}`} className="relative block aspect-[4/3] overflow-hidden">
        {img ? (
          <img
            src={img}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-slate-200 text-slate-400">
            Sem foto
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant="accent">{PURPOSE_LABELS[property.purpose]}</Badge>
          <Badge variant="outline" className="bg-white/90 backdrop-blur">
            {PROPERTY_TYPE_LABELS[property.type]}
          </Badge>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col pt-4">
        <p className="font-display text-lg font-semibold text-primary transition group-hover:text-accent">
          {property.title}
        </p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-3.5 shrink-0" />
          {property.neighborhood}, {property.city}
        </p>
        <p className="mt-3 font-display text-2xl font-bold text-primary">
          {formatCurrencyBRL(property.price)}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
          {property.area != null ? (
            <span className="flex items-center gap-1">
              <Maximize2 className="size-3.5" />
              {property.area} m²
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <Bed className="size-3.5" />
            {property.bedrooms} qts
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {property.bathrooms} wc
          </span>
          <span className="flex items-center gap-1">
            <Car className="size-3.5" />
            {property.parking_spaces} vagas
          </span>
        </div>
        <div className="mt-auto pt-6">
          <Link
            to={`/imoveis/${property.id}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-primary-hover hover:shadow-lg"
          >
            Ver detalhes
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
