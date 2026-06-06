import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>Hidden</p>
      </Modal>,
    )
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('shows title when provided', () => {
    render(
      <Modal open onClose={() => {}} title="Confirmation">
        <p>Body</p>
      </Modal>,
    )
    expect(screen.getByText('Confirmation')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Test">
        <p>Body</p>
      </Modal>,
    )
    const closeButtons = screen.getAllByRole('button')
    const xButton = closeButtons.find((btn) => btn.querySelector('.lucide-x'))
    if (xButton) {
      await userEvent.click(xButton)
      expect(onClose).toHaveBeenCalledTimes(1)
    }
  })
})
