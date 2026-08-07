import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {ActionPill} from './ActionPill'

describe('ActionPill', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders as a button when no href is given', () => {
    render(
      <ActionPill
        icon={<span>icon</span>}
        ariaLabel="Save post"
        onClick={mockOnClick}
      />
    )

    expect(screen.getByRole('button', {name: 'Save post'})).toBeInTheDocument()
  })

  it('calls onClick when the button is clicked', async () => {
    render(
      <ActionPill
        icon={<span>icon</span>}
        ariaLabel="Save post"
        onClick={mockOnClick}
      />
    )

    await user.click(screen.getByRole('button', {name: 'Save post'}))

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('disables the button when disabled is true', () => {
    render(
      <ActionPill
        icon={<span>icon</span>}
        ariaLabel="Save post"
        onClick={mockOnClick}
        disabled
      />
    )

    expect(screen.getByRole('button', {name: 'Save post'})).toBeDisabled()
  })

  it('renders the visible label text', () => {
    render(
      <ActionPill
        icon={<span>icon</span>}
        ariaLabel="Share post"
        onClick={mockOnClick}
        label="Share"
      />
    )

    expect(screen.getByText('Share')).toBeInTheDocument()
  })

  it('renders as a link with the given href when provided', () => {
    render(
      <ActionPill
        icon={<span>icon</span>}
        ariaLabel="View comments, 42"
        href="/r/test/comments/abc123#comments"
        label="42"
      />
    )

    const link = screen.getByRole('link', {name: 'View comments, 42'})
    expect(link).toHaveAttribute('href', '/r/test/comments/abc123#comments')
  })
})
