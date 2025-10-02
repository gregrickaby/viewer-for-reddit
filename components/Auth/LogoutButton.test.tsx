import {LogoutButton} from '@/components/Auth/LogoutButton'
import {render, screen, userEvent, waitFor} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {describe, expect, it, vi} from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

describe('LogoutButton', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    mockPush.mockClear()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush
    } as any)
  })

  it('should render logout button with correct text', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button')).toHaveTextContent('Sign out')
  })

  it('should have correct aria-label', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Sign out')
  })

  it('should call logout endpoint and redirect when clicked', async () => {
    const user = userEvent.setup()

    render(<LogoutButton />)
    const button = screen.getByRole('button')

    await user.click(button)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
  })

  it('should render with custom variant', () => {
    render(<LogoutButton variant="filled" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render with custom size', () => {
    render(<LogoutButton size="sm" />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render as full width when specified', () => {
    render(<LogoutButton fullWidth />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})
