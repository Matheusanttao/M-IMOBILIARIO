import type { PropertyRow } from '@/types'
import { PropertyCard } from '@/components/property/PropertyCard'

export function PropertyGrid({ items }: { items: PropertyRow[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">
        Nenhum imóvel encontrado com esses filtros.
      </div>
    )
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  )
}
