'use client'

import { Filter } from 'lucide-react'
import type { PropertyListFilters, PropertyPurpose, PropertyType } from '@/types'
import { PROPERTY_TYPES, PURPOSES } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'

const emptyPurpose: SelectOption[] = [{ value: '', label: 'Todos' }, ...PURPOSES]
const emptyType: SelectOption[] = [
  { value: '', label: 'Todos' },
  ...PROPERTY_TYPES,
]

const roomsOptions: SelectOption[] = [
  { value: '', label: 'Qualquer' },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` })),
]

export function PropertyFilters({
  value,
  onChange,
  onApply,
  mobileOpen,
  onMobileClose,
}: {
  value: PropertyListFilters
  onChange: (next: PropertyListFilters) => void
  onApply?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}) {
  const fields = (
    <div className="space-y-4">
      <Select
        label="Finalidade"
        options={emptyPurpose}
        value={value.purpose ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            purpose: (e.target.value || undefined) as PropertyPurpose | '' | undefined,
          })
        }
      />
      <Select
        label="Tipo"
        options={emptyType}
        value={value.type ?? ''}
        onChange={(e) =>
          onChange({
            ...value,
            type: (e.target.value || undefined) as PropertyType | '' | undefined,
          })
        }
      />
      <Input
        label="Cidade"
        value={value.city ?? ''}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        placeholder="Ex: São Paulo"
      />
      <Input
        label="Bairro"
        value={value.neighborhood ?? ''}
        onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
        placeholder="Ex: Jardins"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Preço mín."
          type="number"
          min={0}
          value={value.priceMin ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              priceMin: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="0"
        />
        <Input
          label="Preço máx."
          type="number"
          min={0}
          value={value.priceMax ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              priceMax: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="Ilimitado"
        />
      </div>
      <Select
        label="Quartos (mín.)"
        options={roomsOptions}
        value={
          value.bedrooms && value.bedrooms > 0 ? String(value.bedrooms) : ''
        }
        onChange={(e) =>
          onChange({
            ...value,
            bedrooms: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />
      <Select
        label="Suítes (mín.)"
        options={roomsOptions}
        value={
          value.suites && value.suites > 0 ? String(value.suites) : ''
        }
        onChange={(e) =>
          onChange({
            ...value,
            suites: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />
      <Select
        label="Banheiros (mín.)"
        options={roomsOptions}
        value={
          value.bathrooms && value.bathrooms > 0 ? String(value.bathrooms) : ''
        }
        onChange={(e) =>
          onChange({
            ...value,
            bathrooms: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />
      <Select
        label="Vagas (mín.)"
        options={roomsOptions}
        value={
          value.parking_spaces && value.parking_spaces > 0
            ? String(value.parking_spaces)
            : ''
        }
        onChange={(e) =>
          onChange({
            ...value,
            parking_spaces: e.target.value ? Number(e.target.value) : undefined,
          })
        }
      />
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => {
          onChange({})
          onApply?.()
        }}
      >
        Limpar filtros
      </Button>
      {onApply ? (
        <Button type="button" className="w-full lg:hidden" onClick={onApply}>
          Aplicar
        </Button>
      ) : null}
    </div>
  )

  return (
    <>
      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2 font-semibold text-primary">
            <Filter className="size-5" />
            Filtros
          </div>
          {fields}
        </div>
      </div>
      <Modal
        open={Boolean(mobileOpen)}
        onClose={() => onMobileClose?.()}
        title="Filtros"
        className="max-w-lg"
      >
        {fields}
      </Modal>
    </>
  )
}
