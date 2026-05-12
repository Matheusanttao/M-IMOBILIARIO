export type PropertyPurpose = 'venda' | 'aluguel'

export type PropertyType =
  | 'casa'
  | 'apartamento'
  | 'terreno'
  | 'sala_comercial'

/** Status público / operação */
export type ImovelStatus =
  | 'disponivel'
  | 'reservado'
  | 'vendido'
  | 'alugado'
  | 'oculto'

export type UserRole = 'master' | 'admin' | 'gerente' | 'corretor'

export type LeadStatus =
  | 'novo'
  | 'contatado'
  | 'qualificado'
  | 'negociacao'
  | 'convertido'
  | 'perdido'

export interface ImovelImagemRow {
  id: string
  imovel_id: string
  url: string
  public_id: string
  is_capa: boolean
  ordem: number
  created_at: string
}

export interface ImovelRow {
  id: string
  empresa_id: string
  corretor_id: string | null
  proprietario_id: string | null
  titulo: string
  descricao: string | null
  tipo: PropertyType
  finalidade: PropertyPurpose
  preco: number
  cidade: string
  bairro: string
  endereco: string | null
  quartos: number
  suites: number
  banheiros: number
  vagas: number
  area: number | null
  status: ImovelStatus
  destaque: boolean
  slug: string | null
  latitude: number | null
  longitude: number | null
  video_url: string | null
  tour_virtual_url: string | null
  seo_titulo: string | null
  seo_descricao: string | null
  visualizacoes: number
  created_at: string
  updated_at: string
  imovel_imagens?: ImovelImagemRow[]
}

export interface LeadRow {
  id: string
  empresa_id: string
  imovel_id: string
  corretor_id: string | null
  name: string
  phone: string | null
  email: string | null
  message: string | null
  origem: string
  status: LeadStatus
  tags: unknown
  created_at: string
}

export interface EmpresaRow {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  cor_primaria: string
  cor_secundaria: string
  whatsapp: string | null
  ativa: boolean
}

export interface UsuarioRow {
  id: string
  empresa_id: string
  nome: string
  email: string
  role: UserRole
  avatar_url: string | null
  creci: string | null
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
  suites?: number
  bathrooms?: number
  parking_spaces?: number
}

export interface ImovelInsert {
  empresa_id: string
  titulo: string
  descricao?: string | null
  tipo: PropertyType
  finalidade: PropertyPurpose
  preco: number
  cidade: string
  bairro: string
  endereco?: string | null
  quartos: number
  suites: number
  banheiros: number
  vagas: number
  area?: number | null
  status: ImovelStatus
  destaque: boolean
  corretor_id?: string | null
}

export type ImovelUpdate = Partial<ImovelInsert> & { updated_at?: string }

export interface VisitaRow {
  id: string
  empresa_id: string
  imovel_id: string
  lead_id: string | null
  corretor_id: string | null
  data_hora: string
  status: 'agendada' | 'realizada' | 'cancelada'
  observacoes: string | null
}

export interface BlogPostRow {
  id: string
  empresa_id: string
  titulo: string
  slug: string
  conteudo: string
  imagem_capa: string | null
  publicado: boolean
  created_at: string
}
