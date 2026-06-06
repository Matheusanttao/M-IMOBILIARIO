import type { ImovelStatus, PropertyPurpose, PropertyType } from '@/types'

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  casa: 'Casa',
  apartamento: 'Apartamento',
  terreno: 'Terreno',
  sala_comercial: 'Sala comercial',
}

export const PURPOSE_LABELS: Record<PropertyPurpose, string> = {
  venda: 'Venda',
  aluguel: 'Aluguel',
}

export const IMOVEL_STATUS_LABELS: Record<ImovelStatus, string> = {
  disponivel: 'Disponível',
  reservado: 'Reservado',
  vendido: 'Vendido',
  alugado: 'Alugado',
  oculto: 'Oculto',
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = (
  Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]
).map(([value, label]) => ({ value, label }))

export const PURPOSES: { value: PropertyPurpose; label: string }[] = (
  Object.entries(PURPOSE_LABELS) as [PropertyPurpose, string][]
).map(([value, label]) => ({ value, label }))

export const PAGE_SIZE = 9
