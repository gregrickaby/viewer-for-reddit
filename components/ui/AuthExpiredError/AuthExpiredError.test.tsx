import {clearExpiredSession} from '@/lib/actions/auth'
import {render, screen, user} from '@/test-utils'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {AuthExpiredError} from './AuthExpiredError'

// Mock server actions
vi.mock('@/lib/actions/auth', () => ({
  clearExpiredSession: vi.fn(async () => ({success: true, wasExpired: true}))
}))

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn()
  })
}))

const mockClearExpiredSession = vi.mocked(clearExpiredSession)

describe('AuthExpiredError', () => {
  beforeEach(() => {
    mockClearExpiredSession.mockClear()
    mockPush.mockClear()
  })

  it('renders with correct content', () => {
    render(<AuthExpiredError />)

    expect(screen.getByText('Session Expired')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Your login session has expired. Please sign in again to continue.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {name: 'Sign In Again'})
    ).toBeInTheDocument()
  })

  it('clears session and redirects when button clicked', async () => {
    render(<AuthExpiredError />)

    const button = screen.getByRole('button', {name: 'Sign In Again'})
    await user.click(button)

    expect(mockClearExpiredSession).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/api/auth/login')
  })

  it('still redirects if session clear fails', async () => {
    mockClearExpiredSession.mockRejectedValueOnce(new Error('Network error'))

    render(<AuthExpiredError />)

    const button = screen.getByRole('button', {name: 'Sign In Again'})
    await user.click(button)

    // Should still redirect even if clear fails
    expect(mockPush).toHaveBeenCalledWith('/api/auth/login')
  })

  it('prevents race conditions', async () => {
    // Make the clear operation slow so we can see isPending in action
    mockClearExpiredSession.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({success: true, wasExpired: true}), 50)
        )
    )

    render(<AuthExpiredError />)

    const button = screen.getByRole('button', {name: 'Sign In Again'})

    // Click once and immediately check if button is disabled
    await user.click(button)
    expect(button).toBeDisabled()

    // Should only call once due to isPending check
    expect(mockClearExpiredSession).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when pending', async () => {
    // Make the clear operation slow so we can catch the loading state
    mockClearExpiredSession.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({success: true, wasExpired: true}), 100)
        )
    )

    render(<AuthExpiredError />)

    const button = screen.getByRole('button', {name: 'Sign In Again'})
    await user.click(button)

    // Button should immediately be disabled after click
    expect(button).toBeDisabled()
  })
})
