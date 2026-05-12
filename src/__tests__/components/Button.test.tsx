import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByText('Primary')
    expect(btn.className).toContain('bg-primary')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByText('Secondary')
    expect(btn.className).toContain('border-2')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByText('Delete')
    expect(btn.className).toContain('bg-red-600')
  })

  it('shows loading spinner and disables button', () => {
    render(<Button loading>Loading</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn.querySelector('.animate-spin')).toBeTruthy()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('fires onClick', async () => {
    let clicked = false
    render(<Button onClick={() => { clicked = true }}>Go</Button>)
    await userEvent.click(screen.getByText('Go'))
    expect(clicked).toBe(true)
  })

  it('does not fire onClick when disabled', async () => {
    let clicked = false
    render(<Button disabled onClick={() => { clicked = true }}>Go</Button>)
    await userEvent.click(screen.getByText('Go'))
    expect(clicked).toBe(false)
  })

  it('applies size classes', () => {
    const { rerender } = render(<Button size="sm">SM</Button>)
    expect(screen.getByText('SM').className).toContain('px-3')

    rerender(<Button size="lg">LG</Button>)
    expect(screen.getByText('LG').className).toContain('px-8')
  })
})
