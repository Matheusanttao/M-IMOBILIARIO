import { z } from 'zod'
import type {
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
} from '@/types'

export const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const leadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.union([z.literal(''), z.email('E-mail inválido')]).optional(),
  message: z.string().min(10, 'Escreva uma mensagem (mín. 10 caracteres)'),
})

export const propertyFormSchema = z.object({
  title: z.string().min(3, 'Título obrigatório'),
  description: z.string().min(20, 'Descrição mínima de 20 caracteres'),
  type: z.enum(['casa', 'apartamento', 'terreno', 'sala_comercial']),
  purpose: z.enum(['venda', 'aluguel']),
  price: z.coerce.number().positive('Preço deve ser maior que zero'),
  city: z.string().min(2, 'Cidade obrigatória'),
  neighborhood: z.string().min(2, 'Bairro obrigatório'),
  address: z.string().optional(),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  parking_spaces: z.coerce.number().int().min(0),
  area: z.coerce.number().positive('Metragem obrigatória'),
  status: z.enum(['ativo', 'inativo']),
  featured: z.boolean(),
})

/** Saída validada (coerce de inputs de formulário) */
export type PropertyFormValues = {
  title: string
  description: string
  type: PropertyType
  purpose: PropertyPurpose
  price: number
  city: string
  neighborhood: string
  address?: string
  bedrooms: number
  bathrooms: number
  parking_spaces: number
  area: number
  status: PropertyStatus
  featured: boolean
}
export type LeadFormValues = z.infer<typeof leadSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
