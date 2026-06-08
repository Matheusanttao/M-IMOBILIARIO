import { describe, it, expect } from 'vitest'
import { cn, formatCurrencyBRL, formatDatePt, getCoverImage, buildWhatsAppUrl } from '@/lib/utils'

describe('cn (classnames merge)', () => {
  it('merges classes', () => {
    expect(cn('px-2', 'py-2')).toBe('px-2 py-2')
  })

  it('handles conflicting tailwind classes', () => {
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('handles falsy values', () => {
    const hidden = false
    expect(cn('base', hidden && 'hidden', undefined, null, 'end')).toBe('base end')
  })
})

describe('formatCurrencyBRL', () => {
  it('formats a price in BRL', () => {
    const result = formatCurrencyBRL(350000)
    expect(result).toContain('350.000')
    expect(result).toContain('R$')
  })

  it('formats zero', () => {
    const result = formatCurrencyBRL(0)
    expect(result).toContain('0')
  })
})

describe('formatDatePt', () => {
  it('formats an ISO string to pt-BR short date', () => {
    const result = formatDatePt('2025-06-15T14:30:00Z')
    expect(result).toMatch(/15\/06/)
  })
})

describe('getCoverImage', () => {
  it('returns the cover image URL', () => {
    const images = [
      { url: 'http://a.jpg', is_capa: false },
      { url: 'http://b.jpg', is_capa: true },
    ]
    expect(getCoverImage(images)).toBe('http://b.jpg')
  })

  it('returns the first image if no cover', () => {
    const images = [
      { url: 'http://a.jpg', is_capa: false },
      { url: 'http://b.jpg', is_capa: false },
    ]
    expect(getCoverImage(images)).toBe('http://a.jpg')
  })

  it('returns null for empty array', () => {
    expect(getCoverImage([])).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(getCoverImage(undefined)).toBeNull()
  })

  it('handles legacy image_url field', () => {
    const images = [{ image_url: 'http://old.jpg', is_cover: true }]
    expect(getCoverImage(images)).toBe('http://old.jpg')
  })
})

describe('buildWhatsAppUrl', () => {
  it('builds a correct WhatsApp URL', () => {
    const url = buildWhatsAppUrl('5511999998888', 'Olá!')
    expect(url).toBe('https://wa.me/5511999998888?text=Ol%C3%A1!')
  })

  it('strips non-digit characters from phone', () => {
    const url = buildWhatsAppUrl('+55 (11) 99999-8888', 'Oi')
    expect(url).toBe('https://wa.me/5511999998888?text=Oi')
  })
})
