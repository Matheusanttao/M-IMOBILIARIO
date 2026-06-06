import type { ImovelRow } from '@/types'
import { PropertyCard } from '@/components/property/PropertyCard'

export function PropertyGrid({ items }: { items: ImovelRow[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-16 text-center text-white/55">
        Nenhum imóvel encontrado com esses filtros.
      </div>
    )
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  )
}
