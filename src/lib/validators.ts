import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const leadSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]).optional(),
  message: z.string().min(10, 'Escreva uma mensagem (mín. 10 caracteres)'),
})

export const propertyFormSchema = z.object({
  titulo: z.string().min(3, 'Título obrigatório'),
  descricao: z.string().min(20, 'Descrição mínima de 20 caracteres'),
  tipo: z.enum(['casa', 'apartamento', 'terreno', 'sala_comercial']),
  finalidade: z.enum(['venda', 'aluguel']),
  preco: z.coerce.number().positive('Preço deve ser maior que zero'),
  cidade: z.string().min(2, 'Cidade obrigatória'),
  bairro: z.string().min(2, 'Bairro obrigatório'),
  endereco: z.string().optional(),
  quartos: z.coerce.number().int().min(0),
  suites: z.coerce.number().int().min(0),
  banheiros: z.coerce.number().int().min(0),
  vagas: z.coerce.number().int().min(0),
  area: z.coerce.number().positive('Metragem obrigatória'),
  status: z.enum([
    'disponivel',
    'reservado',
    'vendido',
    'alugado',
    'oculto',
  ] as const),
  destaque: z.boolean(),
  captador_id: z.string().optional(),
})

export type PropertyFormValues = z.infer<typeof propertyFormSchema>
export const contatoSchema = z.object({
  nome: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(8, 'Telefone inválido'),
  mensagem: z.string().min(10, 'Escreva uma mensagem (mín. 10 caracteres)'),
})

export type ContatoFormValues = z.infer<typeof contatoSchema>
export type LeadFormValues = z.infer<typeof leadSchema>
export type LoginFormValues = z.infer<typeof loginSchema>
