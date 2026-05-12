import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="E-mail" name="email" />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<Input name="search" placeholder="Buscar..." />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Nome" name="name" error="Campo obrigatório" />)
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('adds error styles when error is present', () => {
    render(<Input label="Nome" name="name" error="Required" />)
    const input = screen.getByLabelText('Nome')
    expect(input.className).toContain('border-red')
  })

  it('accepts user input', async () => {
    render(<Input label="Cidade" name="city" />)
    const input = screen.getByLabelText('Cidade')
    await userEvent.type(input, 'São Paulo')
    expect(input).toHaveValue('São Paulo')
  })
})
