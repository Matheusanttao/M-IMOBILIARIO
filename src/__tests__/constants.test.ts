import { describe, it, expect } from 'vitest'
import {
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  IMOVEL_STATUS_LABELS,
  PROPERTY_TYPES,
  PURPOSES,
  PAGE_SIZE,
} from '@/lib/constants'

describe('constants', () => {
  it('PAGE_SIZE is a positive integer', () => {
    expect(PAGE_SIZE).toBeGreaterThan(0)
    expect(Number.isInteger(PAGE_SIZE)).toBe(true)
  })

  it('PROPERTY_TYPE_LABELS covers all types', () => {
    expect(Object.keys(PROPERTY_TYPE_LABELS)).toEqual(
      expect.arrayContaining(['casa', 'apartamento', 'terreno', 'sala_comercial']),
    )
  })

  it('PURPOSE_LABELS covers venda and aluguel', () => {
    expect(PURPOSE_LABELS).toHaveProperty('venda')
    expect(PURPOSE_LABELS).toHaveProperty('aluguel')
  })

  it('IMOVEL_STATUS_LABELS covers all statuses', () => {
    const expected = ['disponivel', 'reservado', 'vendido', 'alugado', 'oculto']
    expect(Object.keys(IMOVEL_STATUS_LABELS)).toEqual(expect.arrayContaining(expected))
  })

  it('PROPERTY_TYPES array has value/label shape', () => {
    expect(PROPERTY_TYPES.length).toBeGreaterThan(0)
    PROPERTY_TYPES.forEach((item) => {
      expect(item).toHaveProperty('value')
      expect(item).toHaveProperty('label')
      expect(typeof item.value).toBe('string')
      expect(typeof item.label).toBe('string')
    })
  })

  it('PURPOSES array has value/label shape', () => {
    expect(PURPOSES.length).toBe(2)
    PURPOSES.forEach((item) => {
      expect(item).toHaveProperty('value')
      expect(item).toHaveProperty('label')
    })
  })
})
