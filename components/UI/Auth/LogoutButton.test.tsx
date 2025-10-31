import {LogoutButton} from '@/components/UI/Auth/LogoutButton'
import {render, screen, user, waitFor} from '@/test-utils'
import {useRouter} from 'next/navigation'
import {describe, expect, it, vi} from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

describe('LogoutButton', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    mockPush.mockClear()
    mockRefresh.mockClear()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh
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
    render(<LogoutButton />)
    const button = screen.getByRole('button')

    await user.click(button)

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
    expect(mockRefresh).toHaveBeenCalled()
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
