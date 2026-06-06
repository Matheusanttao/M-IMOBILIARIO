import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>Disponível</Badge>)
    expect(screen.getByText('Disponível')).toBeInTheDocument()
  })

  it('applies success variant', () => {
    render(<Badge variant="success">Ativo</Badge>)
    const badge = screen.getByText('Ativo')
    expect(badge.className).toContain('emerald')
  })

  it('applies muted variant', () => {
    render(<Badge variant="muted">Oculto</Badge>)
    const badge = screen.getByText('Oculto')
    expect(badge.className).toContain('slate')
  })
})
