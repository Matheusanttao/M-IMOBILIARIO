export type PropertyPurpose = 'venda' | 'aluguel'

export type PropertyType =
  | 'casa'
  | 'apartamento'
  | 'terreno'
  | 'sala_comercial'

export type PropertyStatus = 'ativo' | 'inativo'

export interface PropertyImageRow {
  id: string
  property_id: string
  image_url: string
  public_id: string
  is_cover: boolean
  created_at: string
}

export interface PropertyRow {
  id: string
  title: string
  description: string | null
  type: PropertyType
  purpose: PropertyPurpose
  price: number
  city: string
  neighborhood: string
  address: string | null
  bedrooms: number
  bathrooms: number
  parking_spaces: number
  area: number | null
  status: PropertyStatus
  featured: boolean
  user_id: string | null
  created_at: string
  updated_at: string
  property_images?: PropertyImageRow[]
}

export interface LeadRow {
  id: string
  property_id: string
  name: string
  phone: string | null
  email: string | null
  message: string | null
  created_at: string
}

export type PropertySort = 'price_asc' | 'price_desc' | 'recent'

export interface PropertyListFilters {
  purpose?: PropertyPurpose | ''
  city?: string
  neighborhood?: string
  type?: PropertyType | ''
  priceMin?: number
  priceMax?: number
  bedrooms?: number
  bathrooms?: number
  parking_spaces?: number
}

export interface PropertyInsert {
  title: string
  description?: string | null
  type: PropertyType
  purpose: PropertyPurpose
  price: number
  city: string
  neighborhood: string
  address?: string | null
  bedrooms: number
  bathrooms: number
  parking_spaces: number
  area?: number | null
  status: PropertyStatus
  featured: boolean
  user_id: string
}

export interface PropertyUpdate extends Partial<PropertyInsert> {
  updated_at?: string
}
