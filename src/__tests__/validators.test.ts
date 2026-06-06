import { describe, it, expect } from 'vitest'
import { loginSchema, leadSchema, propertyFormSchema } from '@/lib/validators'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'admin@test.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '12345' })
    expect(result.success).toBe(false)
  })
})

describe('leadSchema', () => {
  it('accepts valid lead', () => {
    const result = leadSchema.safeParse({
      name: 'João Silva',
      phone: '11999998888',
      email: 'joao@email.com',
      message: 'Tenho interesse no imóvel do centro.',
    })
    expect(result.success).toBe(true)
  })

  it('allows empty email', () => {
    const result = leadSchema.safeParse({
      name: 'João',
      phone: '11999998888',
      message: 'Quero saber mais sobre o imóvel',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = leadSchema.safeParse({
      name: '',
      phone: '11999998888',
      message: 'Quero saber mais',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short message', () => {
    const result = leadSchema.safeParse({
      name: 'João',
      phone: '11999998888',
      message: 'Oi',
    })
    expect(result.success).toBe(false)
  })
})

describe('propertyFormSchema', () => {
  const validProperty = {
    titulo: 'Apartamento Centro',
    descricao: 'Lindo apartamento no centro da cidade com vista para o mar.',
    tipo: 'apartamento' as const,
    finalidade: 'venda' as const,
    preco: 450000,
    cidade: 'Florianópolis',
    bairro: 'Centro',
    endereco: 'Rua XV de Novembro, 100',
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    area: 120,
    status: 'disponivel' as const,
    destaque: false,
  }

  it('accepts valid property', () => {
    const result = propertyFormSchema.safeParse(validProperty)
    expect(result.success).toBe(true)
  })

  it('rejects missing titulo', () => {
    const result = propertyFormSchema.safeParse({ ...validProperty, titulo: '' })
    expect(result.success).toBe(false)
  })

  it('rejects short descricao', () => {
    const result = propertyFormSchema.safeParse({ ...validProperty, descricao: 'Curto' })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = propertyFormSchema.safeParse({ ...validProperty, preco: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects zero price', () => {
    const result = propertyFormSchema.safeParse({ ...validProperty, preco: 0 })
    expect(result.success).toBe(false)
  })

  it('coerces string numbers', () => {
    const result = propertyFormSchema.safeParse({
      ...validProperty,
      preco: '500000',
      quartos: '3',
      area: '90',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.preco).toBe(500000)
      expect(result.data.quartos).toBe(3)
    }
  })

  it('validates status enum', () => {
    const result = propertyFormSchema.safeParse({ ...validProperty, status: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('validates tipo enum', () => {
    const result = propertyFormSchema.safeParse({ ...validProperty, tipo: 'mansion' })
    expect(result.success).toBe(false)
  })
})
